import React from "react";
import { CloutCastPromotion, Post } from '@types';
import { StyleSheet, View } from "react-native";
import { NavigationProp } from "@react-navigation/native";
import { PostComponent } from "@components/post/post.component";
import { CloutCastPostRequirementsComponent } from "./cloutCastPostRequirements.component";
import { CloutCastPostActionsComponent } from "./cloutCastPostActions.component";
import { themeStyles } from "@styles/globalColors";

interface Props {
    navigation: NavigationProp<any> | any;
    route: any;
    promotion: CloutCastPromotion;
}

export class CloutCastPostComponent extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return <View style={[styles.container, themeStyles.borderColor]}>
            <CloutCastPostRequirementsComponent
                navigation={this.props.navigation}
                promotion={this.props.promotion}
            ></CloutCastPostRequirementsComponent>

            <PostComponent
                route={this.props.route}
                navigation={this.props.navigation}
                post={this.props.promotion.post as Post}
                hideBottomBorder={true} />

            <CloutCastPostActionsComponent
                route={this.props.route}
                navigation={this.props.navigation}
                promotion={this.props.promotion}
            ></CloutCastPostActionsComponent>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            paddingBottom: 10,
            borderBottomWidth: 1
        }
    }
);
