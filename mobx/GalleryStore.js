import {makeAutoObservable, runInAction} from 'mobx';
import {calcImageDimensions} from "../common/funcions";
import {encode} from "base64-arraybuffer";
import {galleryAPI} from "../api/api";
import {apiPageSize} from "../common/const";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_GALLERY_PAGE_ = 'STORAGE_GALLERY_PAGE_'
const STORAGE_BASE64_IMAGE_ = 'STORAGE_BASE64_IMAGE_'

export default class GalleryStore {

    gallery = []
    currentPage = 0

    response = ''

    appColumnCount = 1
    appImagesWidth = null

    detailPhoto = {
        id: null,
        width: null,
        height: null
    }

    base64Images = {}

    isFetching: false

    constructor() {
        makeAutoObservable(this, {}, {autoBind: true})
    }

    async writeToStorage(prefix, id, item) {
        try {
            await AsyncStorage.setItem(prefix + id, JSON.stringify(item))
        } catch (error) {
            alert(error.message)
        }
    }

    async readFromStorage(prefix, id) {
        try {
            const storedValue = await AsyncStorage.getItem(prefix + id)
            return storedValue ? JSON.parse(storedValue) : null
        } catch (error) {
            alert(error.message)
        }
    }

    async getGalleryImage(id, width, height) {
        let imageDimensions = calcImageDimensions(this.appImagesWidth, height / width)

        const getImageResponse = await galleryAPI.getImage(id, imageDimensions.width, imageDimensions.height)

        runInAction(() => {
            this.base64Images[id] = `data:${getImageResponse.headers['content-type'].toLowerCase()};base64,${encode(getImageResponse.data)}`
        })
    }

    async _getGallery(page) {
        try {
            runInAction(
                () => this.isFetching = true
            )
            const getGalleryResponse = await galleryAPI.getGallery(page, apiPageSize)
            return getGalleryResponse.data

        } catch (error) {
            alert(error.message)
        } finally {
            runInAction(
                () => this.isFetching = false
            )
        }

    }

    async getNextPage() {
        this.currentPage++

        const response = await this._getGallery(this.currentPage)

        runInAction(() => {
            this.gallery.push(...response)
        })

        for (let photo of response) {
            await this.getGalleryImage(photo.id, photo.width, photo.height)
        }


        await this.writeToStorage(STORAGE_GALLERY_PAGE_, this.currentPage, response)
        const value = await this.readFromStorage(STORAGE_GALLERY_PAGE_, this.currentPage)
        runInAction(() => {
            this.response = value
        })


    }


    setDetailPhoto(id, width, height) {
        runInAction(() =>
            this.detailPhoto = {id, width, height}
        )
    }

    setAppImagesSize(width) {
        runInAction(() => {
            this.appImagesWidth = width
        })
    }

    toggleColumnCount() {
        this.appColumnCount = (this.appColumnCount === 1) ? 2 : 1
    }
}
