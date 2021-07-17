import React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { themeStyles } from '@styles/globalColors';

export default function CloutFeedLoaderLogoComponent(): JSX.Element {
    const config = {
        xmlns: 'http://www.w3.org/2000/svg',
        width: 38.403,
        height: 50.51
    };
    return (
        <Svg
            {...config}
        >
            <Defs>
                <ClipPath id="CloutFeedLoader_svg__a">
                    <Path fill="none" d="M-1-1h38.403v50.51H-1z" />
                </ClipPath>
            </Defs>
            <G
                data-name="Scroll Group 1"
                transform="translate(1 1)"
                clipPath="url(#CloutFeedLoader_svg__a)"
            >
                <G data-name="Group 22" fill="none" strokeWidth={1.5}>
                    <Path
                        data-name="Path 86"
                        d="M19.076 47.574l16.135-19.862a.49.49 0 00-.395-.8L18.135 37.26 1.447 26.917a.49.49 0 00-.384.807l17.234 19.862a.512.512 0 00.779-.012z"
                        stroke={themeStyles.fontColorMain.color}
                    />
                    <Path
                        data-name="Path 87"
                        d="M35.098 25.98l-1.926-.94-2.537-1.28-4.463-2.22c-6.875 8.5-8.037 8.72-8.037 8.72l-7.5-8.5-8.948 4.514a.969.969 0 00-.047 1.716l16.084 9.228a1.029 1.029 0 001.036-.009l16.394-9.787a.758.758 0 00-.056-1.442z"
                        stroke={themeStyles.fontColorMain.color}
                    />
                    <Path
                        data-name="Path 88"
                        d="M18.768 30.327l16.135-19.862a.49.49 0 00-.395-.8L17.989 20.26c-.428 0-17.511-10.1-17.234-9.782L17.989 30.34a.512.512 0 00.779-.013z"
                        stroke={themeStyles.fontColorMain.color}
                    />
                    <Path
                        data-name="Path 89"
                        d="M34.753 8.454L18.39.86a1.03 1.03 0 00-.9.015L1.379 9.028a.969.969 0 00-.044 1.716l16.084 9.228a1.03 1.03 0 001.037-.009l16.393-9.787a.97.97 0 00-.096-1.722z"
                        stroke={themeStyles.fontColorMain.color}
                    />
                </G>
            </G>
        </Svg >
    );
}
