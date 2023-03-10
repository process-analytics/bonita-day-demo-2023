type ActivityRecommendations = Record<string, string>;

const recommendationData = new Map<string, ActivityRecommendations>();
recommendationData.set('SRM subprocess', {
  'Allocate Resource': 'Resource unavailable for SRM: Awaiting Approval',
  'Contact Client': 'late delivery',
});

export function getRecommendationData(): Map<string, ActivityRecommendations> {
  return recommendationData;
}

export function getActivityRecommendationData(activityName: string): ActivityRecommendations | undefined {
  return recommendationData.get(activityName);
}
