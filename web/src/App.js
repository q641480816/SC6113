import './App.css';
import { useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux'
import { setCampaignList, setSelectedCampaign, setRefresh } from './redux/campaignSlice';
import { setWallet } from './redux/walletSlice';
import axios from 'axios';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import detectEthereumProvider from "@metamask/detect-provider";
import Button from '@mui/material/Button';
import Campaign from './pages/Campaign';
import FindCampaign from './pages/FindCampaign';
import CONSTANTS from './constants.json';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { closeToast, openErrorToast } from './redux/feedbackSlice';


const theme = createTheme({
  palette: {
    mode: 'light', // or 'dark'
    primary: {
      main: '#fcc015',
      light: '#FFD96E',
      dark: '#CC9701',
    },
    secondary: {
      main: '#1434CB',
      light: '#3651CE',
      dark: '#091D7A',
    }
  }
});


const App = () => {
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const refresh = useSelector((state) => state.campaignSlice.refresh);
  const selectedCmpaign = useSelector((state) => state.campaignSlice.selectedCmpaign);
  const wallet = useSelector(state => state.walletSlice.addr);
  const [provider, setProvider] = useState(null);
  const toastOpen = useSelector(state => state.feedbackSlice.toast.open);
  const severity = useSelector(state => state.feedbackSlice.toast.severity);
  const message = useSelector(state => state.feedbackSlice.toast.message);
  const dispatch = useDispatch();


  useEffect(() => {
    if (!refresh) return;


    getCampaignList();
    dispatch(setRefresh(false));
  }, [refresh])


  useEffect(() => {
    if (provider) {
      provider.on("accountsChanged", handleAccountsChanged);
    }
  }, [provider])


  const handleToastClose = (event, reason) => {
    if (reason === 'clickaway') { return; } dispatch(closeToast());
  };


  const connect = () => {
    if (wallet) return;
    const getProvider = () => {
      return new Promise((resolve, reject) => {
        if (provider) {
          resolve(provider)
        } else {
          detectEthereumProvider()
            .then(provider => {
              if (provider) {
                setProvider(provider)
                resolve(provider);
              } else {
                reject("no provider");
              }
            })
            .catch(err => reject(err));
        }
      })
    }


    getProvider()
      .then(provider => provider.request({ method: "eth_requestAccounts" }))
      .then(accounts => updateAccount(accounts))
      .catch(err => {
        dispatch(openErrorToast('Error in Connecting wallet'))
        console.log(err);
      });
  }


  const handleAccountsChanged = (accounts) => {
    updateAccount(accounts);
  }


  const updateAccount = (accounts) => {
    dispatch(setWallet(accounts.length === 0 ? '' : accounts[0]));
  }


  const getCampaignList = () => {
    axios.get(`${CONSTANTS.indexer}/getCampaign`)
      .then(list => dispatch(setCampaignList(list.data)))
      .catch(err => {
        dispatch(openErrorToast('Error Getting campaign list'))
        console.log(err);
      });
  }


  const renderBody = () => {
    if(selectedCmpaign){
      return <Campaign provider={provider} />
    }else{
      return <FindCampaign provider={provider} />;
    }
  }


  return (
    <ThemeProvider theme={theme} >
      <div className="App">
        <div id="header">
          <div id="headerLogo">Rate My CEO</div>
          <Button
            variant="text"
            color="primary"
            id="walletConnect"
            startIcon={<AccountBalanceWalletIcon style={{ fontSize: 30 }} color='primary' />}
            onClick={() => connect()}
          >
            {wallet ? wallet.substring(0, 4) + '...' + wallet.substring(wallet.length - 3) : 'Connect'}
          </Button>
        </div>


        <div id="faucetBody">
          {renderBody()}
        </div>
        <Snackbar open={toastOpen} autoHideDuration={4000} onClose={handleToastClose}>
          <Alert
            onClose={handleToastClose}
            severity={severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {message}
          </Alert>
        </Snackbar>


      </div>
    </ThemeProvider>
  );
}


export default App;
