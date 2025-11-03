export interface BaseSetting<T> {
    id: string;
    default?: T;
    label: string;
    description?: string;
    disabled?: boolean;
}

export interface DropdownSetting extends BaseSetting<string> {
    type: "dropdown";
    options: { label: string; value: string }[];
    allowNone?: boolean;
}

export interface NumberSetting extends BaseSetting<number> {
    type: "number";
    min?: number;
    max?: number;
    step?: number;
}

export interface ToggleSetting extends BaseSetting<boolean> {
    type: "toggle";
}

export interface TextSetting extends BaseSetting<string> {
    type: "text";
    placeholder?: string;
    maxLength?: number;
}

export interface SliderSetting extends BaseSetting<number> {
    type: "slider";
    min: number;
    max: number;
    step?: number;
}

export interface RadioSetting extends BaseSetting<string> {
    type: "radio";
    options: { label: string; value: string }[];
}

export interface ColorSetting extends BaseSetting<string> {
    type: "color";
    rgba?: boolean;
}

export interface CustomSetting extends BaseSetting<any> {
    type: "custom";
    render: (container: HTMLElement, currentValue: any, onChange: (newValue: any) => void) => void;
}

export type PluginSetting = DropdownSetting | NumberSetting | ToggleSetting | TextSetting
    | SliderSetting | RadioSetting | ColorSetting | CustomSetting;

export interface SettingGroup {
    type: "group";
    label: string;
    settings: PluginSetting[];
}

export type PluginSettingsDescription = (PluginSetting | SettingGroup)[];

export type SettingsChangeCallback = (newValue: any, oldValue: any, remote: boolean) => void;

export interface SettingsMethods {
    create: (description: PluginSettingsDescription) => void;
    listen: (key: string, callback: SettingsChangeCallback) => () => void;
}

export type PluginSettings = SettingsMethods & Record<string, any>;