import axios from "axios";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
const SLACK_TOKEN = process.env.SLACK_TOKEN || "";

const getSlackUserByEmail = async (email: string) => {
	return await axios.post(
		"https://slack.com/api/users.lookupByEmail",
		{
			email,
		},
		{
			headers: {
				Authorization: `Bearer ${SLACK_TOKEN}`,
				"Content-Type": "multipart/form-data",
			},
		}
	);
};

const postToSlack = async ({ message, userId }: { message: Record<string, unknown>; userId?: string }) => {
	if (userId) {
		sendPrivateMessageToSlackUser(userId, message);
	}

	await axios.post(SLACK_WEBHOOK_URL, message);
};

const sendPrivateMessageToSlackUser = async (id: string, message: Record<string, unknown>) => {
	await axios.post(
		"https://slack.com/api/chat.postMessage",
		{
			channel: id,
			...message,
		},
		{
			headers: {
				Authorization: `Bearer ${SLACK_TOKEN}`,
				"Content-Type": "application/json",
			},
		}
	);
};

export { getSlackUserByEmail, postToSlack };
