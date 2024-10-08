import { ChartDataViewer, ChartExtensionData } from "../js/chartExtension";
import { ChatContainer } from "../js/messageCounter";

export type Peak = {
    endIndex: number,
    endValue: number,
    startIndex: number,
    startValue: number
};

export type DataLabelComputed = {
    dataLabel: string;
    dataLabelColor: string;
};

export type ThemeBackgroundColor = 'dark' | 'light';


/**
 * Delete continuous value in array
 * @param { ChartDataViewer } arr 
 * @returns { ChartDataViewer }
 */
const deleteSequenceSameNumber = (arr: ChartDataViewer[]): ChartDataViewer[] =>  {
    const n: number = arr.length;

    if (arr.length < 3) {
      return arr; // If the array has less than 3 elements, there is no real sequence to reduce
    }
  
    const resultat: ChartDataViewer[] = [];
    let i: number = 0;
  
    while (i < n) {
      let debut = i;
  
      // Find the end of the sequence of same numbers
      while (i < n - 1 && arr[i].nbViewer === arr[i + 1].nbViewer) {
        i++;
      }
  
      if (debut === i) {
        // If no duplicates, simply add the unique element
        resultat.push(arr[i]);
      } else {
        // If sequence detected, add the first and last element of the sequence
        resultat.push(arr[debut], arr[i]);
      }
  
      i++;
    }
  
    return resultat;
}


/**
 * value.startsWith("https://www.twitch.tv/") ?
 * @param { string } value 
 * @returns { boolean }
 */
const isURLTwitch = (value: string): boolean => {
    return value.startsWith("https://www.twitch.tv/");
};

/**
 * Get the percentage of a number
 * @param { number } percentage 10%
 * @param { number } number 250
 * @example 10% of 250 is 25
 * @returns { number } 25
 */
const getPercentageOf = (percentage: number, number: number): number => {
    return Math.round((percentage * number) / 100);
};

/**
 * Check if difference is between percentage1 and percentage2
 * @param { number } percentage1 
 * @param { number } percentage2 
 * @param { number } value 
 * @param { number } difference 
 * @returns { boolean }
 */
const isBetweenPercentage = (percentage1: number, percentage2: number, value: number, difference: number): boolean => {

    if (difference < 0) {
        return difference <= getPercentageOf(percentage1, value) && difference >= getPercentageOf(percentage2, value);
    } else {
        return difference >= getPercentageOf(percentage1, value) && difference <= getPercentageOf(percentage2, value);
    }
    
};

const findPeaks = (data: ChartExtensionData, threshold: number) => {
    const peaks: Peak[] = [];

    if (typeof data == 'undefined') return;

    // Add a new peak if diff >= threshold
    const addPeak = (newPeak: Peak): void => {
        if (peaks && newPeak) {
            const diff = newPeak.endValue - newPeak.startValue;
            if (diff >= threshold) {
                peaks.push(newPeak);
            }
        }
    };

    // Check first element
    if (data.length > 1 && data.at(0)! > data.at(1)!) {
        let temp5 = 0;
        //@ts-ignore
        while (data.at(temp5 + 1)!.nbViewer <= data.at(temp5 + 2)!.nbViewer) temp5++;
        //@ts-ignore
        addPeak({ endIndex: 0, endValue: data.at(0)!.nbViewer, startIndex: temp5, startValue: data.at(temp5)!.nbViewer });
    }

    // Check middle elements
    for (let i = 0 ; i < data.length; i++) { // For each data elements
        //@ts-ignore
        if (data.at(i + 1)?.nbViewer && data.at(i)!.nbViewer  > data.at(i - 1)!.nbViewer && data.at(i)!.nbViewer  > data.at(i + 1)?.nbViewer ) { // Check if data[i] is supp to data[i-1] AND if data[i] supp to data[i+1]
            let temp1 = i;
//@ts-ignore
            while (data.at(temp1 - 1)!.nbViewer >= data.at(temp1 - 2)!.nbViewer) temp1--;
//@ts-ignore
            addPeak({ endIndex: i, endValue: data.at(i)!.nbViewer, startIndex: temp1, startValue: data.at(temp1)!.nbViewer });
//@ts-ignore
        } else if (data.at(i + 1)?.nbViewer && data.at(i + 2)?.nbViewer && data.at(i)!.nbViewer === data.at(i + 1)!.nbViewer && data.at(i + 1)!.nbViewer > data.at(i + 2)!.nbViewer) {
            let temp2 = i;
            let temp3 = i;
//@ts-ignore
            while (data.at(temp2)!.nbViewer == data.at(temp2 + 1)!.nbViewer) temp2++;
            //@ts-ignore
            while (data.at(temp3 - 1)!.nbViewer >= data.at(temp3 - 2)!.nbViewer) temp3--;
//@ts-ignore
            if (data.at(i)?.nbViewer && data.at(temp2)!.nbViewer > data.at(temp2 + 1)!.nbViewer) {
                //@ts-ignore
                addPeak({ endIndex: temp2, endValue: data.at(temp2)!.nbViewer, startIndex: temp3, startValue: data.at(temp3)!.nbViewer });
            }
        }
    }

    // Check last element
    //@ts-ignore
    if (data.length > 1 && data.at(-1)!.nbViewer  > data.at(-2)!.nbViewer ) {
        let temp4 = data.length;
        //@ts-ignore
        while (data[temp4 - 1]!.nbViewer >= data.at(temp4 - 2)!.nbViewer) temp4--;
        //@ts-ignore
        addPeak({ endIndex: data.length - 1, endValue: data.at(-1)!.nbViewer, startIndex: --temp4, startValue: data[temp4-- - 2]!.nbViewer });
    }

    return peaks;
}

const detectPeaks = (arr: ChartExtensionData) => {
    let positions = []
    let maximas = []
    for (let i = 1; i < arr.length - 1; i++) {
        //@ts-ignore
        if (arr.at(i)!.nbViewer > arr.at(i - 1)!.nbViewer) {
            //@ts-ignore
            if (arr.at(i)!.nbViewer > arr.at(i + 1)!.nbViewer) {
                positions.push(i);
                //@ts-ignore
                maximas.push(arr.at(i)!.nbViewer);
                //@ts-ignore
            } else if (arr.at(i)!.nbViewer === arr.at(i + 1)!.nbViewer) {
                let temp = i
                //@ts-ignore
                while (arr.at(i)?.nbViewer === arr.at(temp)?.nbViewer) i++
                //@ts-ignore
                if (arr.at(i)?.nbViewer && arr.at(temp)!.nbViewer > arr.at(i)!.nbViewer) {
                    positions.push(temp)
                    //@ts-ignore
                    maximas.push(arr.at(temp)?.nbViewer)
                }
            }
        }
    }
    return { maximas, positions };
}

/**
 * Apply a label and color to data if the difference in the number of viewers is to high
 * @param { ChartExtensionData } data 
 * @param { number } nbViewer 
 * @returns { DataLabelComputed | undefined }
 */
const computedDataLabel = (data: ChartExtensionData, nbViewer: number): Peak[] | undefined => {

    if (data && data.length === 0) return;
//@ts-ignore
    const diff = nbViewer - data.at(-1)!.nbViewer;
    
    if (diff === 0) return;

    let dataLabelColor: string = '';

    // Apply color regarding how high is the raise or decreasement
    if (isBetweenPercentage(1, 10, nbViewer, diff) || isBetweenPercentage(-1, -10, nbViewer, diff)) {
        dataLabelColor = '#fff600';
    } else if (isBetweenPercentage(11, 25, nbViewer, diff) || isBetweenPercentage(-11, -25, nbViewer, diff)) {
        dataLabelColor = '#ffc302';
    } else if (isBetweenPercentage(26, 50, nbViewer, diff) || isBetweenPercentage(-26, -50, nbViewer, diff)) {
        dataLabelColor = '#ff8f00';
    } else if (isBetweenPercentage(51, 75, nbViewer, diff) || isBetweenPercentage(-51, -75, nbViewer, diff)) {
        dataLabelColor = '#ff5b00';
    } else if (isBetweenPercentage(76, 100, nbViewer, diff) || isBetweenPercentage(-76, -100, nbViewer, diff)) {
        dataLabelColor = '#ff0505';
    }

    const isColorEmpty: boolean = dataLabelColor === '';

    if (isColorEmpty) return;

    if (data.length > 3) console.log(detectPeaks(data), findPeaks(data, getPercentageOf(2, nbViewer)));

    return findPeaks(data, getPercentageOf(2, nbViewer));
};

/**
 * 
 * @param { Document } document 
 * @returns Return chat node container
 */
const getChatContainer = (document: Document): ChatContainer => {

    const selector = document.querySelectorAll<HTMLElement>('[data-test-selector="chat-scrollable-area__message-container"]');
    const getHTMLElementByClass = document.getElementsByClassName("Layout-sc-1xcs6mc-0 capulb chat-scrollable-area__message-container");

    return selector ?? getHTMLElementByClass;
};

/**
 * 
 * @param { Document } document 
 * @returns Return streamer's name, above title
 */
const getStreamerName = (document: Document): string => {

    const getHTMLElementByClass = document.getElementsByClassName("CoreText-sc-1txzju1-0 ScTitleText-sc-d9mj2s-0 AAWwv bzDGwQ InjectLayout-sc-1i43xsx-0 dhkijX tw-title")[0]?.innerHTML;
    const getHTMLElementByClassContaining = Array.from(document.getElementsByClassName("tw-title")).filter((element: Element) => element.localName === "h1")[0]?.innerHTML;

    return getHTMLElementByClass ?? getHTMLElementByClassContaining;
};

/**
 * @param { Document } document
 * @returns { string } Game name
 */
const getGameName = (document: Document): string => {
    const selector = document.querySelectorAll<HTMLElement>('[data-a-target="stream-game-link"]');

    const getHTMLElementByData = (selector.length > 1) ? selector[1]?.innerText : selector[0]?.innerText; // If is streaming together
    const getHTMLElementByClass = document.getElementsByClassName("CoreText-sc-1txzju1-0 dLeJdh")[0]?.innerHTML

    return getHTMLElementByData ?? getHTMLElementByClass;
};

/**
 * @param { Document } document
 * @returns { number } Number of viewer
 */
const getNbViewer = (document: Document): number => {

    const getHTMLElementByData = document.querySelectorAll<HTMLElement>('[data-a-target="animated-channel-viewers-count"]')[0]?.innerText;
    const getHTMLElementByClass = document.getElementsByClassName("ScAnimatedNumber-sc-1iib0w9-0 hERoTc")[0]?.innerHTML

    return parseInt(removeSpaceInString(getHTMLElementByData ?? getHTMLElementByClass));
};

/**
 * @param { Document } document
 * @returns { number } Number of viewer
 */
const getDuration = (document: Document): string | undefined => {

    const getHTMLElementByClass = document.getElementsByClassName("live-time")[0]?.innerHTML

    return getHTMLElementByClass;
};

/**
 * 
 * @param { string | undefined } value 
 * @returns { string } String without any spaces
 */
const removeSpaceInString = (value?: string): string => value ? value.replace(/\s+/g, '') : '';

/**
 * Wait for an HTMLElement to appears in DOM by giving a string selector.
 * @param { string } selector 
 * @returns { Promise<Element | null> }
 */
const waitForElm = (selector: string): Promise<Element | null> => {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(_mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
};

const backGroundThemeObserver = (element: Document, callback: (newTheme: ThemeBackgroundColor) => void): void => {
    const elmObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type !== "attributes" && mutation.attributeName !== "class") return;
          //@ts-ignore
          if (mutation.target.className.includes('dark')) {
            callback('dark');
            //@ts-ignore
          } else if (mutation.target.className.includes('light')) {
            callback('light');
          }
        });
    });

    elmObserver.observe(element.documentElement, { attributes: true });
};

/**
 * Apply chart title format to a string
 * @param { string } string 
 * @returns { string }
 */
const formatChartTitle = (string: string): string => {
    return string.replace('/', '') + "'s viewers";
};

export { isURLTwitch, getNbViewer, waitForElm, getDuration, removeSpaceInString, formatChartTitle, getGameName, computedDataLabel, backGroundThemeObserver, detectPeaks, findPeaks, getPercentageOf, getStreamerName, getChatContainer, deleteSequenceSameNumber };