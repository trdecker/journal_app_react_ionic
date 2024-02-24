/**
 * @description Page to create or edit an entry. Users can edit the title, body, tags, moods, and date.
 * TODO: Edit date
 * @author Tad Decker
 * 
 * 2-6-2024
 */

import { InputChangeEventDetail, IonButton, IonCol, IonContent, IonHeader, IonIcon, IonInput, IonPage, IonPopover, IonRow, IonSelect, IonSelectOption, IonTextarea, useIonLoading } from "@ionic/react"
import { arrowBack, camera, menu, mic, save, stop, trash } from "ionicons/icons"
import { useEffect, useState } from 'react'
import { store } from '../../config'
import { createEntry, deleteEntry, updateEntry } from '../api/NotesApi'
import { Entry, Mood, TagItem } from '../types/Types.d'
import { useHistory } from 'react-router'
import { usePhotoGallery, UserPhoto } from '../hooks/usePhotoGallery'
import { VoiceRecorder, VoiceRecorderPlugin, RecordingData, GenericResponse, CurrentRecordingStatus } from 'capacitor-voice-recorder';
import { useAppContext } from '../contexts/AppContext'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { generateId } from "../utils/common"

import './Entry.css'

const NewNote: React.FC = () => {
  const { photos, takePhoto } = usePhotoGallery()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [entryId, setEntryId] = useState<number | undefined>()
  const [presentLoading, dismissLoading] = useIonLoading()

  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [userTags, setUserTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState<string | undefined>(undefined)
  const [isEditMode, setIsEditMode] = useState(false)

  const { reload } = useAppContext()

  const history = useHistory()

  /**
   * Get the current entry when "reload" changes
   */
  useEffect(() => {
      async function getCurrEntry() {
        try {
          // presentLoading()
          const currEntry: Entry = await store.get('currEntry')
          if (currEntry) {
            setTitle(currEntry.title)
            setBody(currEntry.body)
            setEntryId(currEntry.id)
            setSelectedMoods(currEntry?.moods ?? [])
            setSelectedTags(currEntry?.tags ?? [])
            setIsEditMode(await store.get('editMode'))
          }

          // Retrive the tag names the user has created
          const tags: TagItem[] = await store.get('tags')
          // setUserTags(tags ?? [])
          setUserTags([
            "School",
            "Dating",
            "Church",
            "Work",
            "Family",
            "Hobbies",
            "Other"
          ])
          if (tags) {
            // setUserTags((prevTags) => [...prevTags, ...tags])
          }
        } catch (e) {
          console.error(e)
        } finally {
          dismissLoading()
        }
      }

      getCurrEntry()
  }, [reload])

  const changeTitle = (ev: CustomEvent<InputChangeEventDetail>) => {
		const target = ev.target as HTMLIonInputElement | null

		if (target) {
			const val = target.value as string
			setTitle(val)
		}
	}

  const changeNewTag = (ev: CustomEvent<InputChangeEventDetail>) => {
    const target = ev.target as HTMLIonInputElement | null

    if (target) {
      const val = target.value as string
      setNewTag(val)
    }
  }

  const handleSaveTag = () => {
    if (newTag) {
      let tags = userTags
      tags.push(newTag)
      setUserTags(tags)
      store.set('tags', tags)
      // reload()
    }
  }

  const handleBackButton = async () => {
    await store.set('editMode', false) // Set back to false
    setIsEditMode(false)
    await store.set('currEntry', null)
    reload()
    history.push('/home')
  }

  const handleSaveEntry = async () => {
    try {
      await presentLoading()
      const userId = await store.get("userId")
      const entry: Entry = {
        userId,
        title,
        body,
        date: new Date().toString(),
        tags: selectedTags,
        moods: selectedMoods
      }
      // If editting an existing entry, update the entry. Else, create a new entry.
      if (isEditMode) {
        await updateEntry(userId, entry, entryId)
      } else {
        await createEntry(userId, entry)
        await store.set('editMode', true)
        await store.set('currEntry', entry)
      }
      // history.push('/home')
    } catch (e) {
      console.error("Error making note", e)
    } finally {
      dismissLoading()
    }
  }

  /**
   * @description When the selected moods change, update selectedMoods
   * @param ev CustomEvent
   */
  const handleSelectMood = async (ev: CustomEvent) => {
    try {
      if (ev?.detail?.value) {
        setSelectedMoods(ev.detail.value)
      }
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * @description When the selected moods change, update selectedMoods
   * @param ev CustomEvent
   */
  const handleSelectTag = async (ev: CustomEvent) => {
    try {
      if (ev?.detail?.value) {
        setSelectedTags(ev.detail.value)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteEntry = async () => {
    try {
      presentLoading()
      const userId = await store.get("userId")
      if (entryId) {
        await deleteEntry(userId, entryId.toString())
        handleBackButton()
      }
    } catch (e) {
      console.error(e)
    } finally {
      dismissLoading()
    }
  }

  /**
   * Prompts permission to take the photo, then accesses the camera.
   * TODO: Photo will save as part of the entry.
   */
  const handleTakePhoto = () => {
    takePhoto()
  }

  /**
   * 
   */
  const handleRecordAudio = async () => {
    await VoiceRecorder.requestAudioRecordingPermission()
  
    if (await VoiceRecorder.hasAudioRecordingPermission()) {      
      const status = (await VoiceRecorder.getCurrentStatus()).status
      console.log(status)
      if (status == 'NONE') {
        console.log('Start recording!')
        presentLoading()
        await VoiceRecorder.startRecording()
        dismissLoading()
      }    

      else if (status == 'RECORDING') {
        console.log('...stopping...')
        presentLoading()
        await VoiceRecorder.stopRecording()
        dismissLoading()
      }
      else if (status == 'PAUSED') {

      }
    }
  }

  const getRecordingIcon = async () => {
    let icon = mic
    const recordingStatus = (await VoiceRecorder.getCurrentStatus()).status
    // if (recordingStatus == 
    
  }

  return (
    <IonPage id="entryPage">
      {/* Content */}
      <IonContent fullscreen>
        {/* Header buttons */}
        <IonHeader id="header">
          {/* Menu Button */}
          <IonButton id="roundButton" onClick={handleBackButton}><IonIcon icon={arrowBack} /></IonButton>
          {/* Search Button */}
          <IonButton id="roundButton"><IonIcon icon={menu} /></IonButton>
        </IonHeader>

        {/* Title*/}
        <IonTextarea 
          id="title"
          value={title} 
          onIonInput={changeTitle}
          label="Title"
          labelPlacement="floating"
          fill="outline"
          />

        <IonRow>
          {/* Tags */}  
          <IonCol>
            <IonSelect 
              label="Tags" 
              labelPlacement="floating" 
              interface="popover" 
              onIonChange={handleSelectTag} 
              multiple={true}
              fill="outline"
              id="selector"
              >
              {/* Every user created tag will be shown */}
              {userTags.map((tag: string) => (
                <IonSelectOption key={tag}>{tag}</IonSelectOption>
              ))}
            </IonSelect>
          </IonCol>
            {/* Moods */}
          <IonCol>
            <IonSelect 
              value={selectedMoods} 
              label="Moods" 
              labelPlacement="floating" 
              interface="popover" 
              multiple={true} 
              onIonChange={handleSelectMood}
              fill="outline"
              id="selector"
            >
              {/* Every "mood" will be shown */}
              {Object.keys(Mood).map((mood) => (
                <IonSelectOption key={mood}>{mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase()}</IonSelectOption>
              ))}
            </IonSelect>
          </IonCol>
        </IonRow>

        {/* Out of scope? Would be cool... */}
        {/* <IonButton id="click-trigger" fill="clear" size="small">New Tag</IonButton>
        <IonPopover trigger="click-trigger" triggerAction="click">
          <IonInput label="New Tag" onIonChange={changeNewTag} />
          <IonButton id="roundButon" onClick={handleSaveTag}><IonIcon icon={add}></IonIcon></IonButton>
        </IonPopover> */}

        {/* Body rich text editor */}
        <ReactQuill 
          id="body"
          theme="snow" 
          value={body} 
          onChange={setBody}
          />

        {/* Buttons */}
        {/* TODO: pretty up and TODO: functionality :) */}
        <div id="footer">
          <IonButton id="roundButton" onClick={handleTakePhoto}><IonIcon icon={camera} /></IonButton>
          <IonButton id="roundButton" onClick={handleRecordAudio}><IonIcon icon={mic} /></IonButton>
          <IonButton id="roundButton" onClick={() => VoiceRecorder.stopRecording()}><IonIcon icon={stop} /></IonButton>
          {/* <IonButton id="roundButton"><IonIcon size="large" icon={pencil}/></IonButton> */}
          <IonButton id="roundButton" onClick={handleSaveEntry}><IonIcon icon={save} /></IonButton>
          {/* TODO: make this disappear if NOT editting an item! */}
          {isEditMode ?
            <IonButton  id="roundButton" onClick={handleDeleteEntry} color="danger">
              <IonIcon icon={trash} size="large" />
            </IonButton>
            : null}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default NewNote