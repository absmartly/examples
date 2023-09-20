import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
const WEB_CONSOLE_URL = process.env.WEB_CONSOLE_URL || "";
const ABSMARTLY_USER_API_KEY = process.env.ABSMARTLY_USER_API_KEY || "";

const postToSlack = async (
  message: Record<string, unknown>,
  settings: { webhookUrl: string }
) => {
  const eventName = message.event_name as string;

  if (eventName.includes("Alert")) {
  }

  if (eventName.includes("Experiment")) {
    const experimentId = message.id as string;
    const { data } = await axios.get(
      `${WEB_CONSOLE_URL}/v1/experiments/${experimentId}`,
      {
        headers: {
          Authorization: `Api-Key ${ABSMARTLY_USER_API_KEY}`,
        },
      }
    );

    const { experiment } = data;

    return await axios.post(settings.webhookUrl, {
      text: "Alert",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: Object.entries(message)
              .map((entry) => {
                switch (entry[0]) {
                  case "id":
                    return [
                      `Experiment: <${WEB_CONSOLE_URL}/experiments/${experimentId}|${experiment.name}>`,
                    ];
                  default:
                    return entry.join(": ");
                }
              })
              .join("\n"),
          },
        },
      ],
    });
  }

  if (eventName.includes("Goal")) {
    return;
  }

  if (eventName.includes("Metric")) {
    return;
  }

  return await axios.post(settings.webhookUrl, {
    text: "Event",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: JSON.stringify(message, null, 2),
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
      await postToSlack(event, {
        webhookUrl: SLACK_WEBHOOK_URL,
      });
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
