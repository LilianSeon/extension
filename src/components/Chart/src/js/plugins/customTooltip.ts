import { ChartDataViewer } from "../../index";
import { timeAgo } from "../../utils/utils";


/**
 * 
 * @param context 
 * @param { string } format
 * @param { Record<string, string> } i18nTexts
 * @returns { string } 15/08/2024 17:44:11
 */
const customTooltipAfterFooter = (context: any, format: string, i18nTexts: Record<string, string>): string => {

    if (context[0].dataset.stack === 'viewersCount') {
        const { time }: { time: Date | string } = context[0].raw;
        const intlFormat = format === 'en' ? 'en-EN' : 'fr-FR';

        return new Intl.DateTimeFormat(intlFormat).format(new Date(time)) + ' - ' + timeAgo(new Date(time), format, i18nTexts);
    } else if (context[0].dataset.stack === 'messagesCount') {
        return '';
    } else {
        return '';
    }
}

/**
 * Display tooltip's core text 
 * @param context
 * @param { string } format
 * @param { Record<string, string> } i18nTexts
 * @returns { string } Viewers : 49 562 | Viewers : 49 562 (-86)
 */
const customTooltipLabel = (context: any, format: string, i18nTexts: Record<string, string>): string | string[] => {
    if (context.dataset.stack === 'viewersCount') {
        const { nbViewer } = context.raw as ChartDataViewer;
        const { data }: { data: ChartDataViewer[] } = context.dataset;
        const { dataIndex } = context;
        const previousValue: number | undefined = (dataIndex > 0) ? data.at(dataIndex - 1)!.nbViewer : undefined;
        const intlFormat = format === 'en' ? 'en-EN' : 'fr-FR';

        const formatNbViewer = new Intl.NumberFormat(intlFormat, { minimumFractionDigits: 0 });
        const label: string = (nbViewer > 1) ? ' Viewers : ' : ' Viewer : ';
        const formatedString: string = label + formatNbViewer.format(nbViewer);

        if (typeof previousValue == 'undefined') return formatedString;

        const diff: number = nbViewer - previousValue;
        if (diff === 0) return formatedString; // If there is no differences don't display it

        const diffString: string = (diff < 0) ? '('+ diff +')' : '(+' + diff+')';

        return formatedString +' '+ diffString;
    } else if (context.dataset.stack === 'messagesCount') {
        const formattedValue = context.formattedValue;
        const { singular_new_message, plural_new_message } = i18nTexts;

        return (formattedValue > 1) ? `${plural_new_message} : ${formattedValue}` : `${singular_new_message} : ${formattedValue}`;
    } else {
        return '';
    }
}

/**
 * 
 * @param context 
 * @returns { string } Game name
 */
const customTooltipTitle = (context: any): string => {
    if (context[0].dataset.stack === 'viewersCount') {
        return context[0].raw.game as string;
    } else if (context[0].dataset.stack === 'messagesCount') {
        return '';
    } else {
        return '';
    }
    
};

export { customTooltipTitle, customTooltipLabel, customTooltipAfterFooter };
