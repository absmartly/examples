import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
const SLACK_TOKEN = process.env.SLACK_TOKEN || "";
const WEB_CONSOLE_URL = process.env.WEB_CONSOLE_URL || "";
const ABSMARTLY_USER_API_KEY = process.env.ABSMARTLY_USER_API_KEY || "";

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const capitalizeKebabCase = (analysisType: string) => {
  return analysisType.split("_").map(capitalize).join(" ");
};

const postToSlack = async (message: Record<string, unknown>) => {
  return await axios.post(SLACK_WEBHOOK_URL, message);
};

const handleEvent = async (event: Record<string, unknown>) => {
  console.log(event);
  const eventName = event.event_name as string;

  const config = {
    headers: {
      Authorization: `Api-Key ${ABSMARTLY_USER_API_KEY}`,
    },
  };

  const blocks = [];

  if (eventName.includes("Alert")) {
    const experimentId = event.experiment_id as string;

    const blocks = [];

    const isPositiveAlert = (event: Record<string, unknown>) => {
      return ["sample_size_reached", "group_sequential_updated"].includes(
        event.type as string
      );
    };

    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `${
          isPositiveAlert(event) ? "✅" : "🚨"
        } Experiment Alert Triggered`,
        emoji: true,
      },
    });

    const { data: experimentRes } = await axios.get(
      `${WEB_CONSOLE_URL}/v1/experiments/${experimentId}`,
      config
    );

    const { experiment } = experimentRes;

    const experimentName = experiment.name as string;

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
      text: "Alert",
      blocks,
    });
  }

  if (eventName.includes("Experiment")) {
    const action = eventName.slice(10).toLowerCase();
    const experimentId =
      action === "restarted"
        ? (event.new_experiment_id as string)
        : (event.id as string);

    const { data: experimentRes } = await axios.get(
      `${WEB_CONSOLE_URL}/v1/experiments/${experimentId}`,
      config
    );
    const { experiment } = experimentRes;

    const experimentName = event.name as string;
    const userId = event.user_id as string;
    const date = new Date(event.event_at as string).toLocaleString();

    blocks.push({
      type: "header",
      text: {
        type: "plain_text",
        text: `🧪 Experiment ${capitalize(action)}`,
        emoji: true,
      },
    });

    const { data: userRes } = await axios.get(
      `${WEB_CONSOLE_URL}/v1/users/${userId}`,
      config
    );

    const { user } = userRes;
    const userEmail = user.email as string;

    const { data: slackUserRes } = await axios.post(
      "https://slack.com/api/users.lookupByEmail",
      {
        email: userEmail,
      },
      {
        headers: {
          Authorization: `Bearer ${SLACK_TOKEN}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const slackUserId = slackUserRes.ok ? slackUserRes.user.id : null;

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Experiment <${WEB_CONSOLE_URL}/experiments/${experimentId}|*${experimentName}*> was ${action} by ${
          slackUserId
            ? `<@${slackUserId}>`
            : `<mailto:${userEmail}|${user.first_name} ${user.last_name}>`
        } at ${date}`,
      },
    });

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
          text: `*Analysis Type:* ${capitalizeKebabCase(
            experiment.analysis_type
          )}`,
        },
      });

      const percentages = experiment.percentages.split("/");

      blocks.push({
        type: "section",
        fields: experiment.variants.map(
          (variant: { name: string; variant: number }, index: number) => ({
            type: "mrkdwn",
            text:
              variant.name !== ""
                ? `*${variant.name} (${percentages[index]}%)*`
                : `*Variant ${String.fromCharCode(65 + variant.variant)} (${
                    percentages[index]
                  }%)*`,
          })
        ),
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
          fields: keysArray.slice(i * 10, i * 10 + 10).map((key) => ({
            type: "mrkdwn",
            text: `${capitalizeKebabCase(key)}`,
          })),
        });
      }
    }

    if (slackUserId) {
      await axios.post(
        "https://slack.com/api/chat.postMessage",
        {
          channel: slackUserId,
          text: "Experiment Event",
          blocks,
        },
        {
          headers: {
            Authorization: `Bearer ${SLACK_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (userId)
      return await postToSlack({
        text: "Experiment Event",
        blocks,
      });
  }

  return await postToSlack({
    text: "Event",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: JSON.stringify(event, null, 2),
        },
      },
    ],
  });
};

const handleWebhookPayload = async (payload: {
  events: Record<string, unknown>[];
}) => {
  const { events } = payload;

  await Promise.all(
    events.map(async (event) => {
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
