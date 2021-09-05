export interface ActionSheetConfig {
    options: string[];
    callback: (p_optionIndex: number) => void;
    destructiveButtonIndex: number[];
    mintingButton?: number;
    headerDescription?: string;
}

export const actionSheet = {
    showActionSheet: (p_config: ActionSheetConfig) => { }
};
