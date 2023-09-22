import axios from "axios";
import { Experiment } from "./absmartly.models";

const ABSMARTLY_USER_API_KEY = process.env.ABSMARTLY_USER_API_KEY || "";
const WEB_CONSOLE_URL = process.env.WEB_CONSOLE_URL || "";

const ABSmartlyConfig = {
	headers: {
		Authorization: `Api-Key ${ABSMARTLY_USER_API_KEY}`,
	},
};

const getExperiment = async (id: string | number) => {
	try {
		return await axios.get<{ experiment: Experiment }>(`${WEB_CONSOLE_URL}/v1/experiments/${id}`, ABSmartlyConfig);
	} catch (error) {
		throw new Error(error);
	}
};

const getUser = async (id: string | number) => {
	try {
		return await axios.get(`${WEB_CONSOLE_URL}/v1/users/${id}`, ABSmartlyConfig);
	} catch (error) {
		throw new Error(error);
	}
};

export { getExperiment, getUser };
