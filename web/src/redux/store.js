import { configureStore } from '@reduxjs/toolkit'
import campaignSlice from './campaignSlice';
import walletSlice from './walletSlice';
import feedbackSlice from './feedbackSlice';

export default configureStore({
  reducer: {
    campaignSlice: campaignSlice,
    walletSlice: walletSlice,
    feedbackSlice: feedbackSlice
  }
})