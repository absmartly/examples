import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { getExperiment, getSlackUserByEmail, getUser, postToSlack } from "./api";
import { ABSmartlyEvent } from "./models";
import { extractAction, capitalize, capitalizeKebabCase, isPositiveAlert } from "./utils";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const WEB_CONSOLE_URL = process.env.WEB_CONSOLE_URL || "";

const handleEvent = async (event: ABSmartlyEvent) => {
	const eventName = event.event_name;
	const blocks = [];

	if (eventName.includes("Alert")) {
		const experimentId = event.experiment_id as string;

		blocks.push({
			type: "header",
			text: {
				type: "plain_text",
				text: `${isPositiveAlert(event) ? "✅" : "🚨"} Experiment Alert Triggered`,
				emoji: true,
			},
		});

		const { data: experimentRes } = await getExperiment(experimentId);

		const { experiment } = experimentRes;

		const experimentName = experiment.name;

		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `Experiment <${WEB_CONSOLE_URL}/experiments/${experimentId}|*${experimentName}*> received a *${capitalizeKebabCase(
					event.type as string
				)}* alert at ${new Date(event.event_at as string).toLocaleString()}`,
			},
		});

		return await postToSlack({
			message: {
				text: "Alert",
				blocks,
			},
		});
	}

	if (eventName.includes("Experiment")) {
		const action = extractAction(event);
		const experimentId = action === "restarted" ? (event.new_experiment_id as string) : (event.id as string);

		const experimentName = event.name as string;
		const userId = event.user_id as string;
		const date = new Date(event.event_at as string).toLocaleString();

		const { data: experimentRes } = await getExperiment(experimentId);
		const { experiment } = experimentRes;

		const { data: userRes } = await getUser(userId);
		const { user } = userRes;

		const userEmail = user.email as string;
		const { data: slackUserRes } = await getSlackUserByEmail(userEmail);
		const slackUserId = slackUserRes.ok ? slackUserRes.user.id : null;

		blocks.push({
			type: "header",
			text: {
				type: "plain_text",
				text: `🧪 Experiment ${capitalize(action)}`,
				emoji: true,
			},
		});

		blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `Experiment <${WEB_CONSOLE_URL}/experiments/${experimentId}|*${experimentName}*> was ${action} by ${
					slackUserId ? `<@${slackUserId}>` : `<mailto:${userEmail}|${user.first_name} ${user.last_name}>`
				} at ${date}`,
			},
		});

		if (event.comment) {
			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Comment:* ${event.comment}`,
				},
			});
		}

		if (action === "restarted") {
			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Iteration:* ${experiment.iteration}`,
				},
			});
		}

		if (eventName === "ExperimentCreated") {
			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Analysis Type:* ${capitalizeKebabCase(experiment.analysis_type)}`,
				},
			});

			const percentages = experiment.percentages.split("/");

			blocks.push({
				type: "section",
				fields: experiment.variants.map((variant, index: number) => ({
					type: "mrkdwn",
					text:
						variant.name !== ""
							? `*${variant.name} (${percentages[index]}%)*`
							: `*Variant ${String.fromCharCode(65 + variant.variant)} (${percentages[index]}%)*`,
				})),
			});
		}

		if (eventName === "ExperimentEdited") {
			blocks.push({
				type: "section",
				text: {
					type: "mrkdwn",
					text: `*Changed Fields:*`,
				},
			});

			const keysArray = Object.keys(event.changes as string);

			for (let i = 0; i < Math.ceil(keysArray.length / 10); i++) {
				blocks.push({
					type: "section",
					fields: keysArray.slice(i * 10, i * 10 + 10).map(key => ({
						type: "mrkdwn",
						text: `${capitalizeKebabCase(key)}`,
					})),
				});
			}
		}

		return await postToSlack({
			message: {
				text: "Experiment Event",
				blocks,
			},
			userId: slackUserId,
		});
	}
};

const handleWebhookPayload = async (payload: { events: ABSmartlyEvent[] }) => {
	const { events } = payload;

	await Promise.all(
		events.map(async event => {
			await handleEvent(event);
		})
	);
};

app.post("/", async (req, res) => {
	try {
		await handleWebhookPayload(req.body);
	} catch (error) {
		console.error(error);
	}

	res.status(200).send();
});

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});
