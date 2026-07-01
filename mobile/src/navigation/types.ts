export type RootStackParamList = {
  Home: undefined;
  SearchResults: { initialQuery?: string };
  DishDetail: { dishSlug: string };
  MenuScan: undefined;
  MenuUploadReview: { jobId: string };
  DetectedDishes: { jobId: string };
  QRScan: undefined;
};
