import type { SponsorConfig } from "../types/sponsorConfig";

// 打赏页目前关闭。启用前，请先配置自己的收款方式。
export const sponsorConfig: SponsorConfig = {
	title: "",
	description: "",
	usage: "",
	showSponsorsList: true,
	showComment: true,
	showButtonInPost: true,
	methods: [],
	sponsors: [],
};
