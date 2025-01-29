// CSS
import '../assets/css/accordion.css';

// Component
import BottomNavigation, { OnClickPlayPauseButtonHandlerBottomNav, OnClickHideShowBarButtonHandlerBottomNav, OnClickHideShowLineButtonHandlerBottomNav, OnClickClearButtonHandlerBottomNav, OnChangeImportHandlerBottomNav, OnClickExportButtonHandlerBottomNav, OnClickExportImageButtonHandlerBottomNav, OnChangeRefreshValueBottomNav } from './BottomNavigation';

export type OnClickArrowAccordionHandler = () => void;
export type OnClickClearButtonHandler = OnClickClearButtonHandlerBottomNav;
export type OnClickExportButtonHandler = OnClickExportButtonHandlerBottomNav;
export type OnClickExportImageButtonHandler = OnClickExportImageButtonHandlerBottomNav;
export type OnClickPlayPauseButtonHandler = OnClickPlayPauseButtonHandlerBottomNav;
export type OnClickHideShowMessageButtonHandler = OnClickHideShowBarButtonHandlerBottomNav;
export type OnClickHideShowViewerButtonHandler = OnClickHideShowLineButtonHandlerBottomNav;
export type OnChangeImportHandler = OnChangeImportHandlerBottomNav;
export type OnChangeRefreshValueHandler = OnChangeRefreshValueBottomNav;

interface IAccordion<E extends Element> {
    arrowAccordion: E | null;
    accordion: E;
    isExpanded: boolean;
    isPlaying: boolean;
    isDisplayMessage: boolean;
    toastContainer: HTMLDivElement;
    collapseChartContainer(): void;
    destroy(): void;
    expandChartContainer(): void;
    getAccordionElement(): Element;
    getChartContainer(): Element | null;
}


export default class Accordion implements IAccordion<Element> {
    arrowAccordion: HTMLElement | null;
    accordion: Element;
    chartContainer: HTMLElement | null;
    tabContent: HTMLElement | null;
    bottomNavigation: BottomNavigation | undefined;
    toastContainer: HTMLDivElement;
    isExpanded: boolean;
    #isPlaying: boolean = true;
    #isDisplayMessage: boolean = true;
    #isDisplayViewer: boolean = true;
    private onClickArrowAccordionHandler: OnClickArrowAccordionHandler;

    constructor(element: Element, refreshValue: number, onClickArrowAccordionHandler: OnClickArrowAccordionHandler, onClickExportButtonHandler: OnClickExportButtonHandler, onChangeImportHandler: OnChangeImportHandler, onClickPlayPauseButtonHandler: OnClickPlayPauseButtonHandler, onClickClearButtonHandler: OnClickClearButtonHandler, onClickHideShowMessageButtonHandler: OnClickHideShowMessageButtonHandler, onClickHideShowViewerButtonHandler: OnClickHideShowViewerButtonHandler, onClickExportImageButtonHandler: OnClickExportImageButtonHandler, onChangeRefreshValue: OnChangeRefreshValueHandler, isExpanded: boolean) {

        const imgSrc = chrome.runtime.getURL('images/logo-transparent.png');

        const htmlString = `
            <section id="accordionExtension" class="accordionExtension border-2 border-solid dark:border-zinc-800 rounded-lg">
                <div class="tabExtension">
                    <div class="flex-container dark:bg-zinc-800 px-2">

                        
                        <div id="headerLabel" class="pt-2 pb-3 h-20 text-center text-white text-xl flex">
                            <img class="my-auto h-14 rounded-full inline-block" src="${ imgSrc }" alt="logo" />
                            <div class="my-auto ml-4 self-center text-3xl font-semibold whitespace-nowrap tracking-wide inline-block text-black dark:text-white">StreaMetrics</div>
                        </div>
                        <div id="arrowAccordion" class="my-auto mr-3 cursor-pointer transition-transform duration-350 ${ isExpanded ? 'rotate-180' : '' }">
                            <svg class="h-8 w-8 text-black dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">  <path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="6 15 12 9 18 15" /></svg>
                        </div>

                    </div>
                    <div id="tab__content" class="tab__content relative">
                        <div id="toastContainer" class="absolute right-4 mt-3 flex flex-col space-y-5 z-50"></div>
                        <p id="chartContainer"></p>
                    </div>
                </div>
            </section>
        `;

        element.insertAdjacentHTML('afterend', htmlString);

        // Toast
        this.toastContainer = document.getElementById('toastContainer') as HTMLDivElement;

        this.arrowAccordion = document.getElementById('arrowAccordion');
        this.arrowAccordion?.addEventListener('click', onClickArrowAccordionHandler);
        this.accordion = document.getElementById('accordionExtension') as Element;
        this.chartContainer = document.getElementById('chartContainer');
        this.tabContent = document.getElementById('tab__content');
        this.isExpanded = isExpanded || true;
        this.onClickArrowAccordionHandler = onClickArrowAccordionHandler;

        // Init BottomNavigation
        this.bottomNavigation = (this.tabContent) ? new BottomNavigation(this.tabContent, refreshValue, onClickPlayPauseButtonHandler, onClickHideShowMessageButtonHandler, onClickHideShowViewerButtonHandler, onClickClearButtonHandler, onChangeImportHandler, onClickExportButtonHandler, onClickExportImageButtonHandler, onChangeRefreshValue) : undefined;

        isExpanded ? this.expandChartContainer() : this.collapseChartContainer();
    };

    /**
     * Change svg icon play / pause and update title
     * @param { boolean } newValue
     */
    set isPlaying(newValue: boolean) {
        this.#isPlaying = newValue;
        if (this.bottomNavigation) {
            this.bottomNavigation.isPlaying = this.#isPlaying;
        }
    };

    get isPlaying(): boolean {
        return this.#isPlaying;
    };
        
    set isDisplayViewer(newValue: boolean) {
        this.#isDisplayViewer = newValue;
        if (this.bottomNavigation) {
            this.bottomNavigation.isDisplayLine = this.#isDisplayViewer;
        }
    };

    set isDisplayMessage(newValue: boolean) {
        this.#isDisplayMessage = newValue;
        if (this.bottomNavigation) {
            this.bottomNavigation.isDisplayBar = this.#isDisplayMessage;
        }
    };

    get isDisplayMessage(): boolean {
        return this.#isDisplayMessage;
    };

    getAccordionElement(): Element {
        return this.accordion;
    };

    getChartContainer(): Element | null {
        return this.chartContainer;
    };

    expandChartContainer(): void {
        if (this.tabContent && this.arrowAccordion) {
            this.tabContent.style.maxHeight = '300px';
            this.arrowAccordion.classList.toggle('rotate-180');
            this.isExpanded = true;
        }
    };

    collapseChartContainer(): void {
        if (this.tabContent && this.arrowAccordion) {
            this.tabContent.style.maxHeight = '0px';
            this.arrowAccordion.classList.toggle('rotate-180');
            this.isExpanded = false;
        }
    };

    destroy(): void {
        this.accordion.remove();
        this.arrowAccordion?.removeEventListener('click', this.onClickArrowAccordionHandler);
    };

};

