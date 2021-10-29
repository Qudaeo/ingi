import React, {useCallback, useEffect} from "react";

import {FlatList, View, useWindowDimensions} from "react-native";
import {observer} from "mobx-react";
import {useStore} from "../../mobx/store";
import GalleryRow from "./GalleryRow";
import NetInfo from "@react-native-community/netinfo";

import SearchPhotoBar from "./SearchPhotoBar";
import ToggleColumnCount from "./ToggleColumnCount";
import LoadingScreen from "../LoadingScreen/LoadingScreen";
import GalleryScreenActivityIndicator from "../LoadingScreen/GalleryScreenActivityIndicator";

const GalleryScreen = (props) => {

    const {galleryStore} = useStore()
    const imagesWidth = useWindowDimensions().width

    const handleViewableItemsChanged = useCallback(async ({viewableItems}) => {
        await galleryStore.setViewableItems(viewableItems)
    }, [])

    galleryStore.setIsAppInternetReachable(NetInfo.useNetInfo().isInternetReachable)

    useEffect(() => {
        galleryStore.initializeApp(imagesWidth)

        return () => {
            galleryStore.saveStateToStorage()
        }
    }, [])

    const galleryByColumn = galleryStore.gallery.reduce((result, el, index) => {
        switch (index % galleryStore.appColumnCount) {
            case 0: {
                return [...result, [el]]
            }
            default: {
                const lastRow = result.pop()
                lastRow.push(el)
                return [...result, lastRow]
            }
        }
    }, [])

    return (
        <View style={{flex: 1}}>
            {/*<Text>'debug info:'</Text>*/}
            {/*<Text>{galleryStore.searchText}</Text>*/}
            {/*<Text>{'galleryStore.setIsShowActivityIndicator=' + galleryStore.isShowActivityIndicator}</Text>*/}
            {/*<Text>{'galleryStore.isAppSync=' + galleryStore.isAppSync}</Text>*/}
            {/*<Text>{'appImagesWidth=' + JSON.stringify(galleryStore.appImagesWidth)}</Text>*/}
            {/*<Text>{'base64 objects=' + Object.keys(galleryStore.base64Images).length}</Text>*/}
            {/*<Text>{'galleryStore.currentPage=' + galleryStore.currentPage}</Text>*/}
            {/*<Text>{'galleryStore.startIndex=' + JSON.stringify(galleryStore.startIndex)}</Text>*/}
            {/*<Button title={'saveStateToStorage'} onPress={galleryStore.saveStateToStorage}/>*/}
            {/*<Button title={'initializeApp()'} onPress={galleryStore.initializeApp}/>*/}
            <SearchPhotoBar
                searchText={galleryStore.searchText}
                searchTextChange={galleryStore.searchTextChange}/>

            <ToggleColumnCount
                appColumnCount={galleryStore.appColumnCount}
                toggleColumnCount={galleryStore.toggleColumnCount}
                isAppInternetReachable={galleryStore.isAppInternetReachable}/>

            {(galleryByColumn.length === 0)
                ? <LoadingScreen messageText={galleryStore.messageText ? galleryStore.messageText : 'loadind...'}/>
                : (galleryByColumn) &&
                <>
                    {galleryStore.isShowActivityIndicator && <GalleryScreenActivityIndicator/>}
                    <FlatList
                        data={galleryByColumn}
                        renderItem={({item}) => <GalleryRow key={item.id} row={item} navigation={props.navigation}/>}
                        onEndReached={() => {
                            galleryStore.getNextPage()
                        }}
                        onEndReachedThreshold={0.5}
                        onViewableItemsChanged={handleViewableItemsChanged}
                    />
                </>}

        </View>
    )

}
export default observer(GalleryScreen)
