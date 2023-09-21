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

const parseAnalysisType = (analysisType: string) => {
  return analysisType.split("_").map(capitalize).join(" ");
}

const postToSlack = async (message: Record<string, unknown>) => {
  return await axios.post(SLACK_WEBHOOK_URL, message);
};

const handleEvent = async (event: Record<string, unknown>) => {
  const eventName = event.event_name as string;

  const config = {
    headers: {
      Authorization: `Api-Key ${ABSMARTLY_USER_API_KEY}`,
    },
  };

  const blocks = [];

  if (eventName.includes("Alert")) {
  }

  if (eventName.includes("Experiment")) {
    const action = eventName.slice(10).toLowerCase();
    const experimentId =
      action === "restarted"
        ? (event.new_experiment_id as string)
        : (event.id as string);

    const experimentName = event.name as string;
    const userId = event.user_id as string;
    const date = new Date(event.event_at as string).toLocaleString();

    blocks.push({
        type: "header",
        text: {
            type: "plain_text",
            text: `🧪 Experiment ${capitalize(action)}`,
            emoji: true,
        }
    })

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

    const slackUserId = slackUserRes.user.id;

    blocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `Experiment <${WEB_CONSOLE_URL}/experiments/${experimentId}|*${experimentName}*> was ${action} by <@${slackUserId}> at ${date}`,
        }
    })

    if (eventName === "ExperimentCreated") {
      const { data: experimentRes } = await axios.get(
          `${WEB_CONSOLE_URL}/v1/experiments/${experimentId}`,
          config
      );
      const { experiment } = experimentRes;

      blocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*Analysis Type:* ${parseAnalysisType(experiment.analysis_type)}`
        }
      })

      const percentages = experiment.percentages.split("/");

      blocks.push({
        type: "section",
        fields: experiment.variants.map((variant: {name:string, variant: number}, index: number) => ({
            type: "mrkdwn",
            text: variant.name !== "" ? `*${variant.name} (${percentages[index]}%)*` : `*Variant ${String.fromCharCode(65 + variant.variant)} (${percentages[index]}%)*`
        }))
      })
    }

    return await postToSlack({
      text: "Experiment Event",
      blocks,
    });
  }

  if (eventName.includes("Goal")) {
    return;
  }

  if (eventName.includes("Metric")) {
    return;
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
  console.log(req.body);

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
