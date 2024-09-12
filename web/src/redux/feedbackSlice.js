import { createSlice } from '@reduxjs/toolkit'

export const feedbackSlice = createSlice({
    name: 'feedbackSlice',
    initialState: {
        toast: {
            open: false,
            severity: 'success',
            message: ''
        }
    },
    reducers: {
        openErrorToast: (state, action) => {
            state.toast = {
                open: true,
                severity: 'error',
                message: action.payload
            }
        },
        openWarningToast: (state, action) => {
            state.toast = {
                open: true,
                severity: 'warning',
                message: action.payload
            }
        },
        openSuccessToast: (state, action) => {
            state.toast = {
                open: true,
                severity: 'success',
                message: action.payload
            }
        },
        closeToast: (state, action) => {
            state.toast.open = false;
        }
    }
});

export const { openSuccessToast, openWarningToast, openErrorToast, closeToast } = feedbackSlice.actions;

export default feedbackSlice.reducer;