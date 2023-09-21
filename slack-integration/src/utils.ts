import { ABSmartlyEvent } from "./absmartly.models";

const capitalize = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

const capitalizeKebabCase = (analysisType: string) => {
	return analysisType.split("_").map(capitalize).join(" ");
};

const extractAction = (event: ABSmartlyEvent) => {
	return event.event_name.slice(10).toLowerCase();
};

const isPositiveAlert = (event: ABSmartlyEvent) => {
	return ["sample_size_reached", "group_sequential_updated"].includes(event.type as string);
};

export { capitalize, capitalizeKebabCase, extractAction, isPositiveAlert };
