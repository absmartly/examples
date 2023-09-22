import axios from "axios";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
const SLACK_TOKEN = process.env.SLACK_TOKEN || "";

const getSlackUserByEmail = async (email: string) => {
	try {
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
	} catch (error) {
		throw new Error(error);
	}
};

const postToSlack = async ({ message, userId }: { message: Record<string, unknown>; userId?: string }) => {
	if (userId) {
		sendPrivateMessageToSlackUser(userId, message);
	}

	try {
		await axios.post(SLACK_WEBHOOK_URL, message);
	} catch (error) {
		throw new Error(error);
	}
};

const sendPrivateMessageToSlackUser = async (id: string, message: Record<string, unknown>) => {
	try {
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
	} catch (error) {
		throw new Error(error);
	}
};

export { getSlackUserByEmail, postToSlack };
