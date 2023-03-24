type ActivityRecommendations = {
  title: string;
  description: string;
};

const recommendationData = new Map<string, ActivityRecommendations[]>();
recommendationData.set('SRM subprocess', [{
  title: 'Reassign Actor',
  description: 'Actor is unavailable',
},
{title: 'Contact Supplier', description: 'Notify a delay'}],
);

export function getRecommendationData(): Map<string, ActivityRecommendations[]> {
  return recommendationData;
}

export function getActivityRecommendationData(activityName: string): ActivityRecommendations[] {
  return recommendationData.get(activityName) ?? [];
}
