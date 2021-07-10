export interface ActionSheetConfig {
    options: string[];
    callback: (p_optionIndex: number) => void;
    destructiveButtonIndex: number[];
    headerDescription?: string;
}

export const actionSheet = {
    showActionSheet: (p_config: ActionSheetConfig) => { }
};
