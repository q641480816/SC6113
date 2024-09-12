import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { setCampaignList, setSelectedCampaign, setRefresh } from '../redux/campaignSlice';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import axios from 'axios';
import CONSTANTS from '../constants.json';
import UTILS from '../web3Utils';
import { openErrorToast, openSuccessToast, openWarningToast } from '../redux/feedbackSlice';
import store from '../redux/store';
import PolicyIcon from '@mui/icons-material/Policy';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';


const Campaign = (props) => {


  const [init, setInit] = useState(false);
  const wallet = useSelector(state => state.walletSlice.addr);
  const campaign = useSelector(state => state.campaignSlice.selectedCmpaign);
  const [campaignResult, setCampaignResutl] = useState([0, 0, 0]);
  const [useVotedOption, setUserVotedOption] = useState({ option: null });
  const [isVerifyOpen, setIsVerifyOpen] = useState(false)
  const dispatch = useDispatch();




  useEffect(() => {
    if (init) return;
    setInit(true);
    getCampaignResult(campaign.campaignId);
  }, [init])


  useEffect(() => {
    if (!wallet) return;
    getUserVoteByCampaign()
  }, [wallet])


  const getUserVoteByCampaign = (address) => {
    axios.post(`${CONSTANTS.voteServer}/getUserVoteByCampaign`, {
      address: address || wallet,
      campianId: campaign.campaignId
    })
      .then(res => setUserVotedOption(res.data))
      .catch(err => {
        console.log(err);
        dispatch(openErrorToast('Error in getting user voted Option'))
      })
  }


  const getCampaignResult = (id) => {
    const state = store.getState();
    if (!state.campaignSlice.selectedCmpaign) return;
    UTILS.readContract(CONSTANTS.campaignContractAddress, 'getCampaignResults', [campaign.campaignId])
      .then(res => {
        const newRes = res.map(v => (Number(v)));
        for (let i = 0; i < newRes.length; i++) {
          if (campaignResult[i] !== newRes[i]) {
            getUserVoteByCampaign(state.walletSlice.addr);
            break;
          }
        }
        setCampaignResutl(newRes);
      })
      .catch(err => {
        console.log(err);
        openErrorToast('Error in getting Campaign Result')
      });


    setTimeout(() => {
      getCampaignResult(id);
    }, 5000);
  }


  const calVotes = (index) => {
    let votes = campaignResult[index];
    if (Object.keys(useVotedOption).length === 1 &&
      useVotedOption.option === campaign.options[index]) votes++;


    return votes;
  }


  const checkDisbled = (index) => {
    if (!wallet) return true;
    return useVotedOption.option !== null && campaign.options[index].toLowerCase() !== useVotedOption.option.toLowerCase();
  }


  const handleVote = (event, index) => {
    event.stopPropagation();
    if (useVotedOption.option !== null) return;
    axios.post(`${CONSTANTS.voteServer}/cast`, {
      address: wallet,
      campianId: campaign.campaignId,
      message: { option: campaign.options[index] }
    })
      .then(res => {
        getUserVoteByCampaign();
        dispatch(openSuccessToast(`Successfully vote for ${campaign.options[index]}`));
      })
      .catch(err => {
        console.log(err);
        dispatch(openErrorToast('Error Voting, server error'))
      })
  }


  return (
    <>
      <div id='backArrow'>
        <Button variant="text" color='secondary' startIcon={<ArrowBackIosNewIcon />}
          onClick={() => dispatch(setSelectedCampaign(null))}>
          <span style={{ fontWeight: 'bold' }}>Back</span>
        </Button>
      </div>


      <div className='flex-column center'>
        <span id='CEOInfolg'>{`${campaign.metadata.ceoName} | ${campaign.metadata.campanyName}`}</span>
        <div id='CEOInfoxs' className='flex-column center display-xs'>
          <span style={{ marginBottom: '8px' }}>{campaign.metadata.ceoName}</span>
          <span style={{ backgroundColor: 'black', width: '30vw', height: '3px' }}></span>
          <span>{campaign.metadata.campanyName}</span>
        </div>
        <p id='campaignDescription'>{campaign.metadata.description}</p>
      </div>
      <div style={{ width: '100%' }} className='flex-column center'>
        <div id='optionTab' className='flex-row' onClick={() => {
          if (!wallet) dispatch(openWarningToast("Please Connect Wallet to vote!"));
        }}>
          <div className='flex-column center'>
            <Button variant="text" disabled={checkDisbled(0)} color='primary' startIcon={<SentimentSatisfiedAltIcon style={{ fontSize: 30 }} />}
              onClick={(e) => handleVote(e, 0)}>
              <span className="option-text" style={{ fontWeight: 'bold' }}>{campaign.options[0]}</span>
            </Button>
            <span className='optionCount'>{`${calVotes(0)} Votes`}</span>
          </div>
          <div className='flex-column center'>
            <Button variant="text" disabled={checkDisbled(1)} color='primary' startIcon={<SentimentNeutralIcon style={{ fontSize: 30 }} />}
              onClick={(e) => handleVote(e, 1)}>
              <span className="option-text" style={{ fontWeight: 'bold' }}>{campaign.options[1]}</span>
            </Button>
            <span className='optionCount'>{`${calVotes(1)} Votes`}</span>
          </div>
          <div className='flex-column center'>
            <Button variant="text" disabled={checkDisbled(2)} color='primary' startIcon={<SentimentVeryDissatisfiedIcon style={{ fontSize: 30 }} />}
              onClick={(e) => handleVote(e, 2)}>
              <span className="option-text" style={{ fontWeight: 'bold' }}>{campaign.options[2]}</span>
            </Button>
            <span className='optionCount'>{`${calVotes(2)} Votes`}</span>
          </div>
        </div>
      </div>
      <div id='voteStatus' className='flex-row center'>
        <div>Vote Status:
          <span style={{ fontWeight: 'bold' }}>  {useVotedOption.option ? useVotedOption.hash ? 'On-Chain' : 'Pending' : 'No Record'}</span></div>
        <Button variant="text" color='secondary' startIcon={<PolicyIcon />}
          onClick={() => setIsVerifyOpen(true)}>
        </Button>
      </div>
      <Dialog
        open={isVerifyOpen}
      >
        <DialogTitle>Verify Your Vote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your Vote Option: {useVotedOption.option}
          </DialogContentText>
          <DialogContentText>
            <div style={{ maxWidth: '80vw', overflowWrap: 'break-word', marginTop: '8px' }}>
              Your Vote Hash: {useVotedOption.hash} [SHA256(Address, Option, countResTillPosition)]
            </div>
          </DialogContentText>
          <DialogContentText>
            <div style={{ maxWidth: '80vw', overflowWrap: 'break-word', marginTop: '8px' }}>
              Your Vote Merkel Proof: {JSON.stringify(useVotedOption.merkleProof)}
            </div>
          </DialogContentText>
          <DialogContentText>
            <div style={{ maxWidth: '80vw', overflowWrap: 'break-word', marginTop: '8px' }}>
              Vote Batch Merkel Root: {useVotedOption.merkleRoot}
            </div>
          </DialogContentText>


        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setIsVerifyOpen(false)}>Close</Button>
          {/* <Button color="secondary" >Verify</Button> */}
        </DialogActions>
      </Dialog>
    </>
  );
}


export default Campaign;


