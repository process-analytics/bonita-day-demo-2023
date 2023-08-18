type ActivityRecommendations = {
  /** The id is used to identify the related "act" button. */
  id: string;
  title: string;
  description: string;
};

const recommendationData = new Map<string, ActivityRecommendations[]>();
recommendationData.set('SRM subprocess', [{
  id: 'reassign-actor',
  title: 'Reassign Actor',
  description: 'Actor is unavailable',
},
{
  id: 'contact-supplier',
  title: 'Contact Supplier',
  description: 'Notify a delay'}],
);

export function getActivityRecommendationData(activityName: string): ActivityRecommendations[] {
  return recommendationData.get(activityName) ?? [];
}
