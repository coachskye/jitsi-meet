import React, { ReactElement, Component } from 'react';
import { connect } from 'react-redux';
import { IReduxState } from '../../../app/types';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { isLayoutTileView } from '../../../video-layout/functions.web';
import {
    AbstractCaptions,
    type IAbstractCaptionsProps,
    _abstractMapStateToProps
} from '../AbstractCaptions';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebaseconfig';
import { getConferenceName } from '../../../base/conference/functions';

interface IProps extends IAbstractCaptionsProps {
    _isLifted: boolean | undefined;
    meeting_name: string;
}

interface IState {
    captions: Array<{ id: string, text: string }>;
}

class Captions extends AbstractCaptions<IProps, IState> {
    private intervalId?: NodeJS.Timeout;

    state: IState = {
        captions: []
    };

    componentDidMount() {
        this.intervalId = setInterval(() => {
            this.updateCaptions();
        }, 1000); // Update every second
    }

    componentWillUnmount() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        console.log('Meeting Ending, component will unmount with meeting_name:', this.props.meeting_name);
        this.saveCaptionsToFirestore();
    }

    updateCaptions() {
        // Update captions with the latest data
        const updatedCaptions = this.state.captions.map(caption => ({
            ...caption,
            text: `${caption.text} (updated)` // Modify as needed
        }));
        this.setState({ captions: updatedCaptions });
    }

    _renderParagraph(id: string, text: string): ReactElement {
        // Use callback to ensure the latest state is used
        this.setState(prevState => {
            const existingCaptionIndex = prevState.captions.findIndex(caption => caption.id === id);
            const updatedCaptions = existingCaptionIndex >= 0
                ? prevState.captions.map((caption, index) =>
                    index === existingCaptionIndex ? { id, text } : caption
                )
                : [...prevState.captions, { id, text }];
                
            return { captions: updatedCaptions };
        });
        console.log('Render Paragraph-->', text);
        return (
            <p key={id}>
                <span>{text}</span>
            </p>
        );
    }

    _renderSubtitlesContainer(paragraphs: Array<ReactElement>): ReactElement {
        const className = this.props._isLifted
            ? 'transcription-subtitles lifted'
            : 'transcription-subtitles';
        console.log('Paragraph Values is -->', paragraphs);
        return (
            <div className={className}>
                {paragraphs}
            </div>
        );
    }

    async saveCaptionsToFirestore() {
        const { captions } = this.state;
        const meetingName = this.props.meeting_name;
        const currentTime = new Date().toISOString();
        const docName = `${meetingName}_${currentTime}`;

        try {
            const docRef = doc(db, 'jitsitranscriptionmeetings', docName);
            await setDoc(docRef, { captions });
            console.log('Captions saved to Firestore successfully!');
        } catch (error) {
            console.error('Error saving captions to Firestore:', error);
        }
    }
}

function mapStateToProps(state: IReduxState) {
    const isTileView = isLayoutTileView(state);
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const localParticipant = getLocalParticipant(state);
    const meeting_name = getConferenceName(state);

    return {
        ..._abstractMapStateToProps(state),
        _isLifted: Boolean(largeVideoParticipant && largeVideoParticipant?.id !== localParticipant?.id && !isTileView),
        meeting_name: meeting_name || 'default_meeting_name'
    };
}

export default connect(mapStateToProps)(Captions);
