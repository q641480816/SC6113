import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCampaignList, setSelectedCampaign, setRefresh } from '../redux/campaignSlice';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import UTILS from '../web3Utils';
import CONSTANTS from '../constants.json';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { openErrorToast, openSuccessToast, openWarningToast } from '../redux/feedbackSlice';
import axios from 'axios';


const FindCampaign = (props) => {


  const wallet = useSelector(state => state.walletSlice.addr);
  const [searchKey, setSearchKey] = useState('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchedCampaign, setSearchedCampaign] = useState([]);
  const campaignList = useSelector((state) => state.campaignSlice.campaignList);


  const dispatch = useDispatch();


  const submitCampaign = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries(formData.entries());
    UTILS.sendTransactions(CONSTANTS.campaignContractAddress, 'beginVoteCampaign',
      [formJson.ceoName + formJson.campanyName, JSON.stringify(formJson), ['Good', 'Mediocer', 'Badd...']])
      .then(res => {
        axios.get(`${CONSTANTS.indexer}/syncCampaign`)
        .then(res => {
          dispatch(setRefresh(true))
          dispatch(openSuccessToast(`Campaign for ${formJson.ceoName} has been created and active now!` ))
        }).catch(err => Promise.reject(err));
      })
      .catch(err => {
        dispatch(openErrorToast('Error in Creating contract'));
        console.log(err);
      })
      .finally(a => setIsCreateFormOpen(false))
  }


  const openSearch = () => {
    const filtered = campaignList.filter(c => c.metadata.campanyName.toUpperCase().includes(searchKey.toUpperCase())
      || c.metadata.ceoName.toUpperCase().includes(searchKey.toUpperCase()))
    setSearchedCampaign(filtered);
    setSearchKey('');
    setIsSearchOpen(true);
  }


  return (
    <div>
      <div id="contentWrapper" style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="faucet-text-bold">Find you CEO</span>
        <span className="faucet-text-bold">Give your honest rate for your CEO</span>
        <div id="requestBox">
          <input id="addressInput" placeholder="Type CEO name or Comapny name"
            value={searchKey} onChange={(e) => setSearchKey(e.target.value.trim())} />
          <div id="requestButton" onClick={() => openSearch()} style={searchKey ? null :
            { backgroundColor: 'grey', cursor: 'not-allowed', borderColor: 'grey' }}>Search</div>
        </div>
        <div className='flex-column' style={{ marginTop: "30px" }}>
          <span className="faucet-text-bold">OR</span>
          <div id="requestBox">
            {/* <input id="addressInput" /> */}
            <div id="requestButton" onClick={() => {
              if (!wallet) return;
              setIsCreateFormOpen(true);
            }} style={wallet ? null : { cursor: 'not-allowed', backgroundColor: 'grey', borderColor: 'grey' }} >
              {wallet ? "Create your own Vote" : "Connect wallet to create your own Vote"}
            </div>
          </div>
        </div>
      </div>


      <Dialog
        open={isCreateFormOpen}
        // sx={{'& .MuiPaper-root': { backgroundColor: '#1434CB', color: 'white' }}}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => submitCampaign(event),
        }}
      >
        <DialogTitle>Create your Vote Campaign for your CEO</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide CEO name, Comapony name and some description.
          </DialogContentText>
          <TextField color="secondary" autoFocus required margin="dense" id="name" name="ceoName" label="CEO Name"
            type="text" fullWidth variant="standard"
          />
          <TextField color="secondary" autoFocus required margin="dense" id="campany" name="campanyName" label="Campany Name"
            type="text" fullWidth variant="standard"
          />
          <TextField color="secondary" autoFocus required margin="dense" id="description" name="description" label="Description Name"
            type="text" fullWidth variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setIsCreateFormOpen(false)}>Cancel</Button>
          <Button color="secondary" type="submit">Let go</Button>
        </DialogActions>
      </Dialog>


      <Dialog
        open={isSearchOpen}
      >
        <DialogTitle>{searchedCampaign.length === 0 ? "No matching CEO found" : "Please select your desired CEO vote Campaign"}</DialogTitle>
        <DialogContent>
          <div className='flex-column'>
            <List sx={{ pt: 0 }}>
              {searchedCampaign.map(c => (
                <ListItem disableGutters key={c.campaignId}>
                  <ListItemButton onClick={() => {
                    dispatch(setSelectedCampaign(c));
                    setIsSearchOpen(false);
                  }}>
                    <div className='flex-column'>
                      <div className='select-campaign-title'>{`${c.metadata.ceoName} | ${c.metadata.campanyName}`}</div>
                      <div style={{ marginTop: '5px' }}>{c.metadata.description}</div>
                    </div>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </div>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setIsSearchOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}


export default FindCampaign;
