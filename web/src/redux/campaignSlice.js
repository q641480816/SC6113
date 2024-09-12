import { createSlice } from '@reduxjs/toolkit'
import { act } from 'react';

export const campaignSlice = createSlice({
  name: 'campaignSlice',
  initialState: {
    refresh: true,
    campaignList: [],
    selectedCmpaign: null
  },
  reducers: {
    setRefresh: (state, action) => {
      state.refresh = action.payload;
    },
    setCampaignList: (state, action) => {
        state.campaignList = action.payload;
    },
    setSelectedCampaign: (state, action) => {
        state.selectedCmpaign = action.payload;
    }
  }
});

export const { setCampaignList, setSelectedCampaign, setRefresh} = campaignSlice.actions;

export default campaignSlice.reducer;