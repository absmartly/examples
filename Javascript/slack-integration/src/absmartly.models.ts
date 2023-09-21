export type ABSmartlyEvent = {
	event_name: string;
	[key: string]: unknown;
};

export type AnalysisType = "fixed_horizon" | "group_sequential";

export type ExperimentVariant = {
	experiment_id: number;
	variant: 0 | 1 | 2 | 3;
	name: string;
	config: string;
};

export type Experiment = {
	id: number;
	name: string;
	display_name: string | null;
	iteration: number;
	iterations?: Experiment[];
	development_at?: string;
	start_at?: string;
	stop_at?: string;
	full_on_at?: string;
	full_on_variant?: number;
	last_seen_in_code_at?: string;
	nr_variants: 2 | 3 | 4;
	percentages: string;
	percentage_of_traffic: number;
	seed: string;
	traffic_seed: string;
	created_at: string;
	created_by_user_id: number;
	updated_at?: string;
	updated_by_user_id?: number;
	description: string;
	unit_type_id: number;
	primary_metric_id: number;
	hypothesis?: string;
	prediction?: string;
	purpose?: string;
	action_points: string;
	audience: string;
	audience_strict: boolean;
	implementation_details: string;
	other: string;

	analysis_type: AnalysisType;
	baseline_primary_metric_mean?: string;
	baseline_primary_metric_stdev?: string;
	baseline_participants_per_day: string | null;
	required_alpha: string;
	required_power: string;
	group_sequential_futility_type: "binding" | "non_binding";
	group_sequential_analysis_count: number;

	variants: ExperimentVariant[];
	minimum_detectable_effect?: number;
	archived: boolean;
	split: number[];

	[key: string]: unknown;
};
