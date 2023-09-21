import axios from "axios";
import { Experiment } from "./models";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
const SLACK_TOKEN = process.env.SLACK_TOKEN || "";
const ABSMARTLY_USER_API_KEY = process.env.ABSMARTLY_USER_API_KEY || "";
const WEB_CONSOLE_URL = process.env.WEB_CONSOLE_URL || "";

const ABSmartlyConfig = {
	headers: {
		Authorization: `Api-Key ${ABSMARTLY_USER_API_KEY}`,
	},
};

const getExperiment = async (id: string | number) => {
	return await axios.get<{ experiment: Experiment }>(`${WEB_CONSOLE_URL}/v1/experiments/${id}`, ABSmartlyConfig);
};

const getUser = async (id: string | number) => {
	return await axios.get(`${WEB_CONSOLE_URL}/v1/users/${id}`, ABSmartlyConfig);
};

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

export { getExperiment, getUser, getSlackUserByEmail, postToSlack };
