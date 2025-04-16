/// <reference types="chrome"/>

// Utils
import { getStreamerImage, getNbViewer, waitForElm, getDuration, formatChartTitle, getGameName, backGroundThemeObserver, ThemeBackgroundColor, extractDataFromJSON, getChatContainer, downloadJSON, downloadImage, getStreamerName, isDarkModeActivated, getCurrentTabId, getCurrentWindowId, checkStreamerStatus, waitUntilElementLoaded } from './components/Chart/src/utils/utils';
import { getStorage, setStorage, updateStreamersListStorage } from './components/Chart/src/utils/utilsStorage';
import IntervalManager from './components/Chart/src/js/intervalManager';

// Components
import Accordion, { OnChangeRefreshValueHandler, OnClickExportButtonHandler, OnClickExportImageButtonHandler, OnClickPlayPauseButtonHandler, OnChangeImportHandler, OnClickClearButtonHandler, OnClickHideShowMessageButtonHandler, OnClickHideShowViewerButtonHandler, OnClickHideShowXLabelsButtonHandler } from './components/Chart/src/components/Accordion';
import { MessageCounter } from './components/Chart/src/js/messageCounter';
import { ToastMessage } from './components/Chart/src/components/Toast';
import ChartExtension, { ChartDataViewer, ChartDownLoadCallbacks } from './components/Chart/src/index';
import ToastManager from './components/Chart/src/js/toastManager';

// CSS
import './components/Chart/src/assets/css/index.css'; // Font

// Typing
import { StorageStatusType, StorageStreamerListType } from './typings/StorageType';
import { EventsResquest } from './typings/MessageType';

// Events Handlers
import { checkStatus } from './handlers/events/eventsHandler';

let tabId: number | undefined;

const i18nKeys = ['clear_data', 'refresh_rate', 'bars', 'line', 'download', 'import_data', 'image', 'data', "singular_second", "plural_second", "time_ago", "justNow", "singular_minute", "plural_minute", "singular_hour", "plural_hour", "singular_day", 
    "plural_day", "singular_week", "plural_week", "singular_month", "plural_month", 
    "singular_year", "plural_year", "plural_new_message", "singular_new_message", "status_active", "status_inactive", "axis_x"];


let chartExtension: ChartExtension | undefined;
//let data: ChartDataViewer[] = [];
let accordionComponent: Accordion | undefined;
//let toastComponent: Toast | undefined;
let accordionElement: HTMLElement | undefined;
let isExtensionInitialized: boolean = false;
let isExtensionInitializing: boolean = false;
let messageCounter: MessageCounter | undefined;
let loopCounter: number = 0;
let intervalManager: IntervalManager | undefined;
let hasImportedData: boolean = false;
let toastManager: ToastManager | undefined;

/**
 * Get needed data then add it to the Chart
 */
const startLoopGetData = async () => {
        const duration: string | undefined = getDuration(document);
        const nbViewer: number = getNbViewer(document);
        const game: string = await getGameName(document);
        let messageAmount: number = 0;
    
        if (chartExtension && duration && nbViewer) {
    
            if (typeof messageCounter !== 'undefined') {
                messageAmount = messageCounter.getAmountOfNewMessages(messageCounter.previousMessagesCount);
            }
    
            //const peaks: Peak[] = computedDataLabel(data, nbViewer) || []; // return dataLabel if needed; 
    
            const newData = {
                id: loopCounter,
                duration,
                nbViewer,
                game,
                time: new Date(),
            } as ChartDataViewer;
    
            // Update title if empty
            if (chartExtension.chartTitle === '') chartExtension.setTitle(formatChartTitle(window.location.pathname), false);
    
            chartExtension.addData(newData, messageAmount);
            //chartExtension.addPeaks(peaks);
            loopCounter++;
    
        }
    
        if (isNaN(nbViewer)) {
            intervalManager?.clear();
            const { language } = await getStorage(["language"]);
            const { status_inactive } = await getI18nMessages(['status_inactive'], language);
            await updateStreamersList({ isEnable: false, status: status_inactive as StorageStatusType });
            waitUntilElementLoaded('p.CoreText-sc-1txzju1-0.fiDbWi') // Wait for viewers counter
                .then(async (element) => { // Then restart fetching data loop
                    if (element) {
                        const { status_active } = await getI18nMessages(['status_active'], language);
                        intervalManager?.play();
                        await updateStreamersList({ isEnable: true, status: status_active as StorageStatusType });
                    }
                });
        }
};

const updateStreamersList = async (payload: Partial<StorageStreamerListType>) => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'updateStreamersList', payload: { tabId, payload }}, (isDone) => {
            resolve(isDone)
        });
    });
};

const onClickArrowAccordionHandler = async (): Promise<void> => {
    const { isAccordionExpanded } = await getStorage(['isAccordionExpanded']);

    if (typeof isAccordionExpanded === 'undefined') await setStorage({ 'isAccordionExpanded': true });

    if (typeof isAccordionExpanded !== 'undefined' && accordionComponent) {
        await setStorage({ 'isAccordionExpanded': !isAccordionExpanded });
        isAccordionExpanded ? accordionComponent.collapseChartContainer() : accordionComponent.expandChartContainer();
    }
};

const onClickClearHandler: OnClickClearButtonHandler = () => {
    if (typeof toastManager !== 'undefined') {
        toastManager.addToQueue('interactive', ToastMessage.interactiveMessage, ToastMessage.interactiveTitle, () => {
            chartExtension?.clearData();
            chartExtension?.clearTitle();
            hasImportedData = false;
        });
    }
};

const onChangeImportHandler: OnChangeImportHandler = async (event: Event): Promise<void> => {
    if (chartExtension && intervalManager && accordionComponent) {
        try {
            const data = await extractDataFromJSON(event, importCallbacks);
            const isDataImported = await chartExtension.importData(data);

            if (isDataImported) {
                toastManager?.addToQueue('success', ToastMessage.importSuccess);
                intervalManager.clear();
                accordionComponent.isPlaying = false;
                hasImportedData = true;
            }
        } catch (error) {
            toastManager?.addToQueue('error', ToastMessage.importErrorFormat);
        }
    }
};

const onChangeRefreshValue: OnChangeRefreshValueHandler = async (refreshValue: number) => {
    await setStorage({ 'refreshValue': refreshValue });
    intervalManager?.updateInterval(refreshValue * 1000);
    if (accordionComponent?.isPlaying) intervalManager?.resume(false);
};

const downLoadCallbacks: ChartDownLoadCallbacks = {
    loadstart: (progress) => {
        if (accordionComponent) accordionComponent.setProgressBarWidth(progress.loaded);
    },
    progress: (progress) => {
        if (accordionComponent) accordionComponent.setProgressBarWidth((progress.loaded/progress.total)*100);
    },
    loadend: () => {
        if (accordionComponent) accordionComponent.setProgressBarWidth(0);
    },
    error: () => {
        toastManager?.addToQueue('error', ToastMessage.downloadError);
    }
};

const importCallbacks : ChartDownLoadCallbacks = {
    ...downLoadCallbacks,
    error: () => {
        toastManager?.addToQueue('error', ToastMessage.importError);
    }
};

const onClickExportImageButtonHandler: OnClickExportImageButtonHandler = async () => {
    const imageString = chartExtension?.exportImage();
    if (imageString) downloadImage(await getStreamerName(document)+'_chart_image.png', imageString, downLoadCallbacks);
};

const onClickExportButtonHandler: OnClickExportButtonHandler = async () => {
    if (chartExtension) downloadJSON(await getStreamerName(document)+'_data.json', chartExtension.getDatas(), downLoadCallbacks);
};

const onClickHideShowViewerButtonHandler : OnClickHideShowViewerButtonHandler = (isDisplayViewer: boolean): void => {
    if (chartExtension && accordionComponent) {
        (isDisplayViewer) ? chartExtension.hideViewersCountDataset() : chartExtension.showViewersCountDataset();
        accordionComponent.isDisplayViewer = !isDisplayViewer;
    }
};

const onClickHideShowMessageButtonHandler : OnClickHideShowMessageButtonHandler = (isDisplayMessage: boolean): void => {
    if (chartExtension && accordionComponent) {
        (isDisplayMessage) ? chartExtension.hideMessagesCountDataset() : chartExtension.showMessagesCountDataset();
        accordionComponent.isDisplayMessage = !isDisplayMessage;
    }
};

const onClickHideShowXLabelsButtonHandler : OnClickHideShowXLabelsButtonHandler = (isDisplayXLabels: boolean): void => {
    if (chartExtension && accordionComponent) {
        (isDisplayXLabels) ? chartExtension.hideXlabels() : chartExtension.showXlabels();
        accordionComponent.isDisplayXLabels = !isDisplayXLabels;
    }
};

const onClickPlayPauseButtonHandler: OnClickPlayPauseButtonHandler = async (isPlaying: boolean): Promise<void> => {
    const { streamersList }: { streamersList?: StorageStreamerListType[] } = await getStorage(['streamersList']);

    if (isPlaying) {
        intervalManager?.pause();

        if (streamersList && tabId) await setStorage({ 'streamersList': updateStreamersListStorage(streamersList, tabId, { status: 'Pause' }) });

    } else {
        if (hasImportedData && chartExtension) {
            chartExtension.clearData();
            chartExtension.clearTitle();
        }
        intervalManager?.resume();
        hasImportedData = false;
        
        const isStreamLive = checkStreamerStatus(document);
        const { language } = await getStorage(["language"]);
        const { status_inactive, status_active } = await getI18nMessages(isStreamLive ? ['status_active'] : ['status_inactive'], language);
        if (streamersList && tabId) await setStorage({ 'streamersList': updateStreamersListStorage(streamersList, tabId, { status: (status_inactive ?? status_active) as StorageStatusType }) });
    }

    if (accordionComponent) accordionComponent.isPlaying = !isPlaying;
};

const getI18nMessages = async <T extends string[]>(keys: T, lang: string): Promise<Record<T[number], string>> => {
    
    return new Promise<Record<T[number], string>>((resolve) => {
        chrome.runtime.sendMessage({ action: 'getI18nMessages', payload: { keys, lang } }, (isDone) => {
            resolve(isDone);
        });
    });
};

const initStorage = async (): Promise<void> => {
    try {
        const result = await getStorage(['isAccordionExpanded']);
        if (typeof result == 'undefined') {
            await setStorage( {'isAccordionExpanded': true} );
        } else {
            return;
        }
    } catch (error) {
        console.log(error);
    }
};

/**
 * Check if `#live-channel-stream-information` is in DOM or wait for it, then start getting datas and init chart
 */
const initChartInDOM = async () => {

    try {
        const { isEnableExtension } = await getStorage(['isEnableExtension']);

        // Do not init if isEnableExtension storage variable is false. 
        if (typeof isEnableExtension !== 'undefined' && isEnableExtension === false) return;
        
        console.log("%c 🚀 StreaMetrics Chrome extension initializing... ", "color: white; background-color: #2563eb; font-size: 14px; padding: 8px; border-radius: 4px;");
        tabId = await getCurrentTabId();
        isExtensionInitializing = true;
        const informationContainer = await waitForElm('#live-channel-stream-information');
        const chartContainer = await waitForElm('.chat-line__message');
        const { language } = await getStorage(["language"]);
        const i18nTexts = await getI18nMessages(i18nKeys, language);

        if (typeof messageCounter === 'undefined' && chartContainer) {
            messageCounter = new MessageCounter(getChatContainer(document));
        }

        await initStorage();

        if (informationContainer && informationContainer.parentNode && chartContainer && typeof accordionComponent == 'undefined' && typeof accordionElement == 'undefined' && document.getElementById("accordionExtension") === null) {
            const { isAccordionExpanded } = await getStorage(['isAccordionExpanded']);
            const { refreshValue } = await getStorage(['refreshValue']);

            if (typeof intervalManager === 'undefined') {
                intervalManager = new IntervalManager(startLoopGetData, (refreshValue ?? 5) * 1000);
            }

            accordionComponent = new Accordion(informationContainer, refreshValue ?? 5, i18nTexts, onClickArrowAccordionHandler, onClickExportButtonHandler, onChangeImportHandler, onClickPlayPauseButtonHandler, onClickClearHandler, onClickHideShowMessageButtonHandler, onClickHideShowViewerButtonHandler, onClickHideShowXLabelsButtonHandler, onClickExportImageButtonHandler, onChangeRefreshValue, isAccordionExpanded);
            accordionElement = accordionComponent.getChartContainer() as HTMLElement;
            accordionComponent.setI18nTexts(i18nTexts);
            accordionComponent.setProgressBarWidth(20);
        }

        console.log('INIT 20% :', accordionElement, chartExtension)
        if (accordionElement && typeof chartExtension == 'undefined') {

            const chartTitle: string = formatChartTitle(window.location.pathname);
            const textColor: string = document.documentElement.className.includes('dark') ? '#ffffff' : '#000000';
            
            chartExtension = new ChartExtension(accordionElement, language, i18nTexts, chartTitle, textColor);
            isExtensionInitializing = false;
            isExtensionInitialized = true;
            accordionComponent?.setProgressBarWidth(60);
            backGroundThemeObserver(document, updateDefaultColor);
            updateDefaultColor(isDarkModeActivated() ? 'dark' : 'light');
            toastManager = new ToastManager(accordionComponent!.toastContainer);

            const { streamersList }: { streamersList?: StorageStreamerListType[] } = await getStorage(['streamersList']);

            const streamerName = await getStreamerName(document);
            accordionComponent?.setProgressBarWidth(70);
            const streamerImage = await getStreamerImage(document, streamerName);
            accordionComponent?.setProgressBarWidth(80);
            const streamerGame = await getGameName(document);
            accordionComponent?.setProgressBarWidth(90);
            const occurrences = streamersList?.filter((streamer) => streamer.streamerName === streamerName).length || 0;
            const windowId = await getCurrentWindowId();

            if(windowId) await addOneStreamer({ occurrences, streamerName, streamerImage, streamerGame, status: i18nTexts.status_active as StorageStatusType, tabId, windowId, streamerURL: document.URL, isEnable: true })
            

            accordionComponent?.setProgressBarWidth(100);
            accordionComponent?.setProgressBarWidth(0);
            console.log("%c ⚡ StreaMetrics Chrome extension started ✨ ", "color: white; background-color: #65a30d; font-size: 14px; padding: 8px; border-radius: 4px;");
        }
    } catch (error) {
        isExtensionInitializing = false;
        isExtensionInitialized = false;
    }
    
    isExtensionInitializing = false;
};

const addOneStreamer = async (newStreamer: StorageStreamerListType) => {
    
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'addOneStreamer', payload: newStreamer }, (isDone) => {
            resolve(isDone);
        });
    });
};


const enableChart = async () => {
    await initChartInDOM();
    const isStreamLive = checkStreamerStatus(document);
    const { language } = await getStorage(["language"]);
    const { status_inactive, status_active } = await getI18nMessages(isStreamLive ? ['status_active'] : ['status_inactive'], language);
    updateStreamersList({ isEnable: true, status: (status_inactive ?? status_active) as StorageStatusType });
};

const disableChart = async () => {
    destroy();
    const { language } = await getStorage(["language"]);
    const { status_inactive } = await getI18nMessages(['status_inactive'], language);
    updateStreamersList({ isEnable: false, status: status_inactive as StorageStatusType });
};

const onTabCreated = async (payload: { url: string }) => {
    if (chartExtension && formatChartTitle(window.location.pathname).includes(chartExtension.chartTitle.replace("'s viewers", ""))) return true;
    
    // If Chart already exists in DOM
    if (chartExtension && chartExtension instanceof ChartExtension && accordionComponent instanceof Accordion && typeof accordionElement !== 'undefined' && messageCounter && intervalManager instanceof IntervalManager) {
        
        deleteStreamersListStorage(payload.url);
        destroy();
    }

    if (document.getElementById('accordionExtension') === null && document.getElementById('extensionChartContainer') === null && !isExtensionInitialized && !isExtensionInitializing) {
        await initChartInDOM();
    }
};

const eventsHandlers: Record<string, any> = {
    checkStatus,
    enableChart,
    disableChart,
    onTabCreated,
    onTabUpdated: onTabCreated
};

chrome.storage.onChanged.addListener(async (changes) => {
    for (let [key, { newValue }] of Object.entries(changes)) {
      if (key === "language" && chartExtension) {
        chartExtension.language = newValue; // Update chart's language
        const i18nTexts = await getI18nMessages(i18nKeys, newValue);
        if (accordionComponent) accordionComponent.setI18nTexts(i18nTexts);
        chartExtension.setI18nTexts(i18nTexts);
      }

      if (key === "isEnableExtension") {
        if(newValue === false) { //TODO: Action Destroy from background.js
            destroy();
        }
      }
    }
});

chrome.runtime.onMessage.addListener((request: EventsResquest, _sender, sendResponse) => { // When user goes from a Twitch URL to another Twitch URL
    (async () => {
        const { isEnableExtension } = await getStorage(['isEnableExtension']);

        // Do not init if isEnableExtension storage variable is false. 
        if (typeof isEnableExtension !== 'undefined' && isEnableExtension === false) return true;

        const { event, payload } = request;

        if (eventsHandlers[event]) {
            eventsHandlers[event](payload, sendResponse).then(sendResponse).catch((err: any) => {
              sendResponse({ error: err.message });
            });
    
            return true; // async response
        }
    })();

    return true;
});

const deleteStreamersListStorage = async (url: StorageStreamerListType['streamerURL']) => {
    const { streamersList }: { streamersList?: StorageStreamerListType[] } = await getStorage(['streamersList']);
    const tabId = await getCurrentTabId();
    const streamerToDelete: StorageStreamerListType[] | undefined = streamersList?.filter((streamer: StorageStreamerListType) => streamer.tabId !== tabId && streamer.streamerURL !== url);
    await setStorage({'streamersList': streamerToDelete});
};

const destroy = () => {
    chartExtension?.destroy();
    accordionComponent?.destroy();
    messageCounter?.destroy();
    intervalManager?.clear();
    intervalManager = undefined;
    messageCounter = undefined;
    chartExtension = undefined;
    accordionComponent = undefined;
    accordionElement = undefined;
    isExtensionInitialized = false;
};

const updateDefaultColor = (theme: ThemeBackgroundColor): void => {
    if (chartExtension instanceof ChartExtension) {
        let newColor: string;
        if (theme === 'dark') { // Dark mode
            newColor = '#ffffff';
            accordionComponent?.accordion?.classList.add('dark'); // Add dark css class for tailwind
        } else { // Light mode
            newColor = '#000000';
            accordionComponent?.accordion?.classList.remove('dark');
        }

        chartExtension.setDefaultColor(newColor);
    }
};


window.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('accordionExtension') === null && document.getElementById('extensionChartContainer') === null && !isExtensionInitialized) {
        await initChartInDOM();
    }
});
