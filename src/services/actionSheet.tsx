export interface ActionSheetConfig {
    options: string[];
    callback: (p_optionIndex: number) => void;
    destructiveButtonIndex: number[];

}

export const actionSheet = {
    showActionSheet: (p_config: ActionSheetConfig) => { }
};
