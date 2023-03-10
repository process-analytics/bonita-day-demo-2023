type ActivityRecommendations = {
  title: string;
  description: string;
};

const recommendationData = new Map<string, ActivityRecommendations[]>();
recommendationData.set('SRM subprocess', [{
  title: 'Allocate Resource',
  description: 'Resource unavailable for SRM: Awaiting Approval',
},
{title: 'Contact Client', description: 'late delivery'}],
);

export function getRecommendationData(): Map<string, ActivityRecommendations[]> {
  return recommendationData;
}

export function getActivityRecommendationData(activityName: string): ActivityRecommendations[] {
  return recommendationData.get(activityName) ?? [];
}
