import point from "geolib/es/isPointWithinRadius";

const isPointWithinRadius =
	"default" in point ? (point.default as typeof point) : point;

type EarthquakeFeature = {
	geometry: {
		coordinates: number[];
		type: string;
	};
	id: string;
	properties: {
		mag: number;
		url: string;
		time: number;
		place: string;
		title: string;
	};
};
type Earthquake = {
	features: EarthquakeFeature[];
	metadata: {
		generated: number;
		url: string;
		features: number;
		title: string;
	};
};

export type EarthquakeSetting = {
	radius: number;
	latitude: number;
	longitude: number;
	mag: number;
};

export type FeedResult = {
	id: number;
	details: {
		title: string;
	};
	content: string[];
};

export const types = {
	"earthquake.usgs.gov": {
		parse: (data: Earthquake, setting: EarthquakeSetting): FeedResult[] => {
			return data.features
				.filter((e) => {
					return (
						e.properties.mag > setting.mag &&
						isPointWithinRadius(
							{
								latitude: setting.latitude,
								longitude: setting.longitude,
							},
							{
								latitude: e.geometry.coordinates[1],
								longitude: e.geometry.coordinates[0],
							},
							setting.radius,
						)
					);
				})
				.map((feature) => ({
					id: feature.properties.time,
					details: {
						title: data.metadata.title,
					},
					content: [
						`🔥 ${feature.properties.mag}`,
						`🌎 ${feature.properties.place}`,
						`📅 ${new Date(feature.properties.time).toLocaleString()}`,
						feature.properties.url,
					],
				}));
		},
	},
};
