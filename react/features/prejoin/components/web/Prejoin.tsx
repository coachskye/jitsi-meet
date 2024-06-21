/* eslint-disable react/jsx-no-bind */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import cong from '../../../../firebaseconfig';
import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { isNameReadOnly } from '../../../base/config/functions.web';
import { IconArrowDown, IconArrowUp, IconPhoneRinging, IconVolumeOff } from '../../../base/icons/svg';
import { isVideoMutedByUser } from '../../../base/media/functions';
import { getLocalParticipant } from '../../../base/participants/functions';
import Popover from '../../../base/popover/components/Popover.web';
import ActionButton from '../../../base/premeeting/components/web/ActionButton';
import PreMeetingScreen from '../../../base/premeeting/components/web/PreMeetingScreen';
import { updateSettings } from '../../../base/settings/actions';
import { getDisplayName } from '../../../base/settings/functions.web';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getLocalJitsiVideoTrack } from '../../../base/tracks/functions.web';
import Button from '../../../base/ui/components/web/Button';
import Input from '../../../base/ui/components/web/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
import isInsecureRoomName from '../../../base/util/isInsecureRoomName';
import { openDisplayNamePrompt } from '../../../display-name/actions';
import { isUnsafeRoomWarningEnabled } from '../../../prejoin/functions';
import {
    joinConference as joinConferenceAction,
    joinConferenceWithoutAudio as joinConferenceWithoutAudioAction,
    setJoinByPhoneDialogVisiblity as setJoinByPhoneDialogVisiblityAction
} from '../../actions.web';
import {
    isDeviceStatusVisible,
    isDisplayNameRequired,
    isJoinByPhoneButtonVisible,
    isJoinByPhoneDialogVisible,
    isPrejoinDisplayNameVisible
} from '../../functions';
import { hasDisplayName } from '../../utils';

import JoinByPhoneDialog from './dialogs/JoinByPhoneDialog';
import Video from '../../../base/media/components/web/Video';
import Preview from '../../../base/premeeting/components/web/Preview';
import AudioMuteButton from '../../../toolbox/components/web/AudioMuteButton';
import VideoMuteButton from '../../../toolbox/components/web/VideoMuteButton';
import { Checkbox } from '@mui/material';

import { getDatabase, ref, onValue } from "firebase/database";

interface IProps {

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean;

    /**
     * If join by phone button should be visible.
     */
    hasJoinByPhoneButton: boolean;

    /**
     * Flag signaling if the display name is visible or not.
     */
    isDisplayNameVisible: boolean;

    /**
     * Joins the current meeting.
     */
    joinConference: Function;

    /**
     * Joins the current meeting without audio.
     */
    joinConferenceWithoutAudio: Function;

    /**
     * Whether conference join is in progress.
     */
    joiningInProgress?: boolean;

    /**
     * The name of the user that is about to join.
     */
    name: string;

    /**
     * Local participant id.
     */
    participantId?: string;

    /**
     * The prejoin config.
     */
    prejoinConfig?: any;

    /**
     * Whether the name input should be read only or not.
     */
    readOnlyName: boolean;

    /**
     * Sets visibility of the 'JoinByPhoneDialog'.
     */
    setJoinByPhoneDialogVisiblity: Function;

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean;

    /**
     * If 'JoinByPhoneDialog' is visible or not.
     */
    showDialog: boolean;

    /**
     * If should show an error when joining without a name.
     */
    showErrorOnJoin: boolean;

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning: boolean;

    /**
     * Whether the user has approved to join a room with unsafe name.
     */
    unsafeRoomConsent?: boolean;

    /**
     * Updates settings.
     */
    updateSettings: Function;

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack?: Object;
}

const useStyles = makeStyles()(theme => {
    return {
        inputContainer: {
            width: '100%'
        },
        joinbutton:{
            backgroundColor:'#FFAF2E',
            color:'black',
            width:'10vw',
            height:'9vh',
            textAlign:'center',
            padding:10,
            fontWeight:'200',
            fontSize:'1vw',
            '@media (max-width: 730px)': {
                height:'5vh',
                width: '12vw',
                fontSize:'1.5vw'
            },
            '@media (max-width: 480px)': {
                height:'5vh',
                width: '23vw',
                fontSize:'2.5vw'
            }
            
            
        },
        
        buttoncontainer:{
            display:'flex' , 
            flexDirection:'row' , 
            position:'absolute' , 
            marginTop:'27%',
            '@media (max-width: 480px)': {
                marginTop:'10rem',
            }
        },
        inputcontainer2:{
            width: '50%',
            height: '100%', 
            padding: '1%', 
            display: 'flex', 
            flexDirection: 'row' ,
            '@media (max-width: 480px)': {
                flexDirection: 'column' ,
                width: '100%',
                padding: '2%',
                margin: 'auto'
            }
        },
        inputcontainer3:{
            width: '50%',
            height: '100%' ,
            '@media (max-width: 480px)': {
               
                width: '100%',
                
               
            }
        },
        Audiotextcontainer:{
            width:'50%' , 
            height:'100%',
            '@media (max-width: 480px)': {
               
                width: '90%',
                margin: 'auto',
                padding: '3%'
            }
        },

        input: {
            width: '100%',
            marginBottom: theme.spacing(3),

            '& input': {
                textAlign: 'center'
            }
        },

        avatarContainer: {
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            width:200,
            height:200
        },

        avatar: {
            margin: `${theme.spacing(2)} auto ${theme.spacing(3)}`
        },

        avatarName: {
            ...withPixelLineHeight(theme.typography.bodyShortBoldLarge),
            color: theme.palette.text01,
            marginBottom: theme.spacing(5),
            textAlign: 'center'
        },

        error: {
            backgroundColor: theme.palette.actionDanger,
            color: theme.palette.text01,
            borderRadius: theme.shape.borderRadius,
            width: '100%',
            ...withPixelLineHeight(theme.typography.labelRegular),
            boxSizing: 'border-box',
            padding: theme.spacing(1),
            textAlign: 'center',
            marginTop: `-${theme.spacing(2)}`,
            marginBottom: theme.spacing(3)
        },

        dropdownContainer: {
            position: 'relative',
            width: '100%'
        },

        dropdownButtons: {
            width: '300px',
            padding: '8px 0',
            backgroundColor: theme.palette.action02,
            color: theme.palette.text04,
            borderRadius: theme.shape.borderRadius,
            position: 'relative',
            top: `-${theme.spacing(3)}`
        }
    };
});

const Prejoin = ({
    deviceStatusVisible,
    hasJoinByPhoneButton,
    isDisplayNameVisible,
    joinConference,
    joinConferenceWithoutAudio,
    joiningInProgress,
    name,
    participantId,
    prejoinConfig,
    readOnlyName,
    setJoinByPhoneDialogVisiblity,
    showCameraPreview,
    showDialog,
    showErrorOnJoin,
    showUnsafeRoomWarning,
    unsafeRoomConsent,
    updateSettings: dispatchUpdateSettings,
    videoTrack
}: IProps) => {
    const showDisplayNameField = useMemo(
        () => isDisplayNameVisible && !readOnlyName,
        [ isDisplayNameVisible, readOnlyName ]);
    const showErrorOnField = useMemo(
        () => showDisplayNameField && showErrorOnJoin,
        [ showDisplayNameField, showErrorOnJoin ]);
    const [ showJoinByPhoneButtons, setShowJoinByPhoneButtons ] = useState(false);
    const [data, setData] = useState([]);
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [devices2, setDevices2] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [selectedDeviceId2, setSelectedDeviceId2] = useState<string>('');

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
            const audioInputDevices = deviceInfos.filter(device => device.kind === 'audioinput');
            setDevices(audioInputDevices);
            if (audioInputDevices.length > 0) {
                setSelectedDeviceId(audioInputDevices[0].deviceId);
            }
        });
    }, []);


    useEffect(() => {
        
        const database = getDatabase(cong);
        
        // Reference to the specific collection in the database
        const collectionRef = ref(database, "testing");
    
        // Function to fetch data from the database
        const fetchData = () => {
          // Listen for changes in the collection
          onValue(collectionRef, (snapshot) => {
            const dataItem = snapshot.val();
    
            // Check if dataItem exists
            if (dataItem) {
              // Convert the object values into an array
              const displayItem = Object.values(dataItem);
              setData(displayItem);
            }
          });
        };
    
        // Fetch data when the component mounts
        fetchData();
      }, []);
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
            const VideoInputDevices = deviceInfos.filter(device => device.kind === 'videoinput');
            setDevices2(VideoInputDevices);
            if (VideoInputDevices.length > 0) {
                setSelectedDeviceId(VideoInputDevices[0].deviceId);
            }
        });
    }, []);

    const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDeviceId(event.target.value);
    };
    const handleDeviceChange2 = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDeviceId2(event.target.value);
    };

    /**
     * Handler for the join button.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onJoinButtonClick = () => {
        if (showErrorOnJoin) {
            dispatch(openDisplayNamePrompt({
                onPostSubmit: joinConference,
                validateInput: hasDisplayName
            }));

            return;
        }
        joinConference();
    };

    /**
     * Closes the dropdown.
     *
     * @returns {void}
     */
    const onDropdownClose = () => {
        setShowJoinByPhoneButtons(false);
    };

    /**
     * Displays the join by phone buttons dropdown.
     *
     * @param {Object} e - The synthetic event.
     * @returns {void}
     */
    const onOptionsClick = (e?: React.KeyboardEvent | React.MouseEvent | undefined) => {
        e?.stopPropagation();

        setShowJoinByPhoneButtons(show => !show);
    };

    /**
     * Sets the guest participant name.
     *
     * @param {string} displayName - Participant name.
     * @returns {void}
     */
    const setName = (displayName: string) => {
        dispatchUpdateSettings({
            displayName
        });
    };

    /**
     * Closes the join by phone dialog.
     *
     * @returns {undefined}
     */
    const closeDialog = () => {
        setJoinByPhoneDialogVisiblity(false);
    };

    /**
     * Displays the dialog for joining a meeting by phone.
     *
     * @returns {undefined}
     */
    const doShowDialog = () => {
        setJoinByPhoneDialogVisiblity(true);
        onDropdownClose();
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const showDialogKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            doShowDialog();
        }
    };

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    const onJoinConferenceWithoutAudioKeyPress = (e: React.KeyboardEvent) => {
        if (joinConferenceWithoutAudio
            && (e.key === ' '
                || e.key === 'Enter')) {
            e.preventDefault();
            joinConferenceWithoutAudio();
        }
    };

    /**
     * Gets the list of extra join buttons.
     *
     * @returns {Object} - The list of extra buttons.
     */
    const getExtraJoinButtons = () => {
        const noAudio = {
            key: 'no-audio',
            testId: 'prejoin.joinWithoutAudio',
            icon: IconVolumeOff,
            label: t('prejoin.joinWithoutAudio'),
            onClick: joinConferenceWithoutAudio,
            onKeyPress: onJoinConferenceWithoutAudioKeyPress
        };

        const byPhone = {
            key: 'by-phone',
            testId: 'prejoin.joinByPhone',
            icon: IconPhoneRinging,
            label: t('prejoin.joinAudioByPhone'),
            onClick: doShowDialog,
            onKeyPress: showDialogKeyPress
        };

        return {
            noAudio,
            byPhone
        };
    };

    /**
     * Handle keypress on input.
     *
     * @param {KeyboardEvent} e - Keyboard event.
     * @returns {void}
     */
    const onInputKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            joinConference();
        }
    };

    const extraJoinButtons = getExtraJoinButtons();
    let extraButtonsToRender = Object.values(extraJoinButtons).filter((val: any) =>
        !(prejoinConfig?.hideExtraJoinButtons || []).includes(val.key)
    );

    if (!hasJoinByPhoneButton) {
        extraButtonsToRender = extraButtonsToRender.filter((btn: any) => btn.key !== 'by-phone');
    }
    const hasExtraJoinButtons = Boolean(extraButtonsToRender.length);

    return (
        <>
        <PreMeetingScreen
            showDeviceStatus = { deviceStatusVisible }
            showUnsafeRoomWarning = { showUnsafeRoomWarning }
            title = {'Coaching session with Caitlin Decker' }
            videoMuted = { !showCameraPreview }
            videoTrack = { videoTrack }>
            {/* <div
                className = { classes.inputContainer }
                data-testid = 'prejoin.screen'>
               
              
         

                {showErrorOnField && <div
                    className = { classes.error }
                    data-testid = 'prejoin.errorMessage'>{t('prejoin.errorMissingName')}</div>}

              
                        
                 
                
            </div> */}
               
                <>
               
                <Preview
                videoTrack = { videoTrack } />
               
                <div className={classes.buttoncontainer}>
                <AudioMuteButton
                styles = {{}} />
            <VideoMuteButton
                styles = { {} } />
                </div>
                </>
                {/* <div>
      <h1>Data from database:</h1>
      <ul>
        {data}
      </ul>
    </div> */}
                
                
                    <div className={classes.inputcontainer2}>
            <div className={classes.inputcontainer3}>
                <p style={{ color: '#52596A',fontSize:'1rem' }}>MICROPHONE</p>
                <select 
                    value={selectedDeviceId} 
                    onChange={handleDeviceChange}
                    style={{ 
                        width: '70%', 
                        height: '30px', 
                        padding: '5px', 
                        borderRadius: '5px',
                        borderColor: '#52596A',
                        color: selectedDeviceId === '' ? '#FFAF2E' : '#52596A'
                    }}>
                    {devices.map(device => (
                        <option 
                            key={device.deviceId} 
                            value={device.deviceId}
                            style={{ 
                                color: device.deviceId === selectedDeviceId ? '#FFAF2E' : '#52596A',
                                paddingLeft: device.deviceId === selectedDeviceId ? '20px' : '5px',
                                background: device.deviceId === selectedDeviceId ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEiIGhlaWdodD0iMTEiIHZpZXdCb3g9IjAgMCAxMSAxMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEgN0w0IDlMMTAgMU03IDlMMTAgMTEgNCAxMSAxIDciIGZpbGw9IiNGMkQ1MTAiIHN0cm9rZT0iIzFFNkJGNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==") no-repeat left center' : 'none',
                                backgroundSize: '12px',
                            }}>
                            {device.label || `Microphone ${device.deviceId}`}
                        </option>
                    ))}
                </select>
            </div>
            <div className={classes.inputcontainer3}>
                <p style={{ color: '#52596A' , fontSize:'1rem'  }}>CAMERA</p>
                <select 
                    value={selectedDeviceId2} 
                    onChange={handleDeviceChange2}
                    style={{ 
                        width: '70%',
                        height: '30px', 
                        padding: '5px', 
                        borderRadius: '5px',
                        borderColor: '#52596A',
                        color: selectedDeviceId2 === '' ? '#FFAF2E' : '#52596A'
                    }}>
                    {devices2.map(device => (
                        <option 
                            key={device.deviceId} 
                            value={device.deviceId}
                            style={{ 
                                color: device.deviceId === selectedDeviceId2 ? '#FFAF2E' : '#52596A',
                                paddingLeft: device.deviceId === selectedDeviceId2 ? '20px' : '5px',
                                background: device.deviceId === selectedDeviceId2 ? 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEiIGhlaWdodD0iMTEiIHZpZXdCb3g9IjAgMCAxMSAxMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEgN0w0IDlMMTAgMU03IDlMMTAgMTEgNCAxMSAxIDciIGZpbGw9IiNGMkQ1MTAiIHN0cmU9IiMxRTZCRjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=") no-repeat left center' : 'none',
                                backgroundSize: '12px',
                            }}>
                            {device.label || `Camera ${device.deviceId}`}
                        </option>
                    ))}
                </select>
            </div>
        </div>
                    <div className={classes.Audiotextcontainer}>
                   
                     <p style={{color:'#52596A' , fontSize:'1rem'}}>  Audio or video not working? Allow microphone and camera permissions in your <span style={{color:'#FFAF2E'}}>Support Page</span></p>
                    </div>

        
                <ActionButton
                          
                            className={classes.joinbutton}
                            ariaLabel = { 'Join Now' }
                            ariaPressed = { showJoinByPhoneButtons }
                            disabled = { joiningInProgress
                                || (showUnsafeRoomWarning && !unsafeRoomConsent)
                                || showErrorOnField }
                        
                            onClick = { onJoinButtonClick }
                          
                            role = 'button'
                            tabIndex = { 0 }
                            testId = 'prejoin.joinMeeting'
                            type = 'primary'>
                            {'JOIN NOW'}
                            
                        </ActionButton>

                    
                       
            {showDialog && (
                <JoinByPhoneDialog
                    joinConferenceWithoutAudio = { joinConferenceWithoutAudio }
                    onClose = { closeDialog } />
            )}
            <div style={{width:'100%'}}>
                <div style={{width:'100%' , height:2 , border:'#E5E3DD 1px solid', backgroundColor:'#E5E3DD'}}></div>
                <div style={{display:'flex', flexDirection:'row',  alignItems: 'center' }}>
                    <Checkbox/>
                <p style={{textAlign:'center' , margin:'0'  , color:'#52596A'}}>Always preview video when joining a call</p>
                </div>
                
            </div>
        </PreMeetingScreen>
       
        </>
    );
};


/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const name = getDisplayName(state);
    const showErrorOnJoin = isDisplayNameRequired(state) && !name;
    const { id: participantId } = getLocalParticipant(state) ?? {};
    const { joiningInProgress } = state['features/prejoin'];
    const { room } = state['features/base/conference'];
    const { unsafeRoomConsent } = state['features/base/premeeting'];

    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        hasJoinByPhoneButton: isJoinByPhoneButtonVisible(state),
        isDisplayNameVisible: isPrejoinDisplayNameVisible(state),
        joiningInProgress,
        name,
        participantId,
        prejoinConfig: state['features/base/config'].prejoinConfig,
        readOnlyName: isNameReadOnly(state),
        showCameraPreview: !isVideoMutedByUser(state),
        showDialog: isJoinByPhoneDialogVisible(state),
        showErrorOnJoin,
        showUnsafeRoomWarning: isInsecureRoomName(room) && isUnsafeRoomWarningEnabled(state),
        unsafeRoomConsent,
        videoTrack: getLocalJitsiVideoTrack(state)
    };
}

const mapDispatchToProps = {
    joinConferenceWithoutAudio: joinConferenceWithoutAudioAction,
    joinConference: joinConferenceAction,
    setJoinByPhoneDialogVisiblity: setJoinByPhoneDialogVisiblityAction,
    updateSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(Prejoin);
