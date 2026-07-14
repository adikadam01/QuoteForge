//ContainerRenderer

import React from "react";

import {
    View,
    Text,
} from "@react-pdf/renderer";

import {
    BlockRenderKind,
} from "@/documents/pdf/DocumentLayoutEngine";

import type {
    PaginationContainer,
} from "@/documents/pdf/DocumentLayoutEngine";

type Props = {

    container: PaginationContainer;

    style?: any;

    children?: React.ReactNode;

};

export default function ContainerRenderer({

    container,

    style,

    children,

}: Props) {

    const containerStyle = [
        style,
    ];

    if (container.isContinuation) {

        // Future:
        // Remove top border
    }

    if (!container.isLastPart) {

        // Future:
        // Remove bottom border
    }


    return (

        <View style={containerStyle}>

            {container.title && (
                <Text
                    style={{
                        fontSize: 10,
                        fontWeight: "bold",
                        color: "#111827",   // Black
                        marginTop: 12,
                        marginBottom: 8,
                    }}
                >
                    {container.title}
                </Text>
            )}

            {children ??

                container.renderedBlocks.map(block => {

                    switch (block.renderKind) {

                        case BlockRenderKind.Heading:

                            return (
                                <Text
                                    key={block.id}
                                    style={{
                                        fontSize: 10,
                                        fontWeight: "bold",
                                        marginTop: 12,
                                        marginBottom: 6,
                                    }}
                                >
                                    {String(block.content)}
                                </Text>
                            );

                        case BlockRenderKind.Bullet:

                            return (
                                <View
                                    key={block.id}
                                    style={{
                                        flexDirection: "row",
                                        marginBottom: 5,
                                    }}
                                >
                                    <Text>• </Text>

                                    <Text>
                                        {String(block.content)}
                                    </Text>
                                </View>
                            );

                        case BlockRenderKind.Numbered:

                            return (
                                <View
                                    key={block.id}
                                    style={{
                                        flexDirection: "row",
                                        marginBottom: 5,
                                    }}
                                >
                                    <Text>
                                        {`${block.data ?? ""}.`}
                                    </Text>

                                    <Text>
                                        {" "}
                                        {String(block.content)}
                                    </Text>
                                </View>
                            );

                        case BlockRenderKind.Paragraph:

                            return (
                                <Text
                                    key={block.id}
                                    style={{
                                        marginBottom: 6,
                                    }}
                                >
                                    {String(block.content)}
                                </Text>
                            );

                        default:

                            return (
                                <Text key={block.id}>
                                    {String(block.content)}
                                </Text>
                            );
                    }
                })

            }

        </View>

    );

}