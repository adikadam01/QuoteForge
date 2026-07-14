



import React from "react";

import {
    View,
    Text,
} from "@react-pdf/renderer";

type Props = {

    styles: any;

    serviceBlocks: any[];

    primaryService: any;

};

export default function ScopePage({

    styles,

    serviceBlocks,

    primaryService,

}: Props) {

    return (

        <>
            {/* Title */}
            <View style={styles.page2TitleBlock}>
                <Text style={styles.sectionLabel}>
                    DELIVERABLES
                </Text>

                <Text style={styles.pageHeading}>
                    SCOPE OF WORK
                </Text>
            </View>

            <View style={styles.serviceListWrap}>
                {(serviceBlocks && serviceBlocks.length > 0
                    ? serviceBlocks
                    : [
                        {
                            service_id: "dummy-1",
                            service_name: "Website Pages Included",
                            description: "",
                            scope_of_work: "dummy item",
                            // deliverables: "",
                            // timeline: "",
                            // payment_terms: "",
                            // service_terms: "",
                            // price: 0,
                        },
                    ]
                ).map((s: any, idx: number) => {
                    const scopeItems = (s.scope_of_work || "dummy item")
                        .split("\n")
                        .map((i: string) => i.trim())
                        .filter(Boolean);

                    const deliverableItems = s.deliverables
                        ? String(s.deliverables)
                            .split("\n")
                            .map((i: string) => i.trim())
                            .filter(Boolean)
                        : [];

                    const useTwoColumns = scopeItems.length > 4;
                    const mid = Math.ceil(scopeItems.length / 2);
                    const colOne = useTwoColumns ? scopeItems.slice(0, mid) : scopeItems;
                    const colTwo = useTwoColumns ? scopeItems.slice(mid) : [];

                    return (
                        <View
                            key={`${s.service_id ?? idx}-${idx}`}
                            style={idx !== 0 ? styles.serviceRowBordered : styles.serviceRow}
                        >
                            <Text style={styles.serviceNumber}>
                                {String(idx + 1).padStart(2, "0")}
                            </Text>
                            <View style={styles.serviceContent}>
                                <Text style={styles.serviceTitleText}>
                                    {s.service_name?.toUpperCase()}
                                </Text>

                                <View style={styles.columnsRow}>
                                    <View
                                        style={
                                            useTwoColumns
                                                ? styles.columnHalf
                                                : styles.columnSingle
                                        }
                                    >
                                        {colOne.map((item: string, i: number) => (
                                            <View key={i} style={styles.bulletItem}>
                                                <Text style={styles.bulletDot}>•</Text>

                                                <Text
                                                    style={styles.bulletText}
                                                    wrap
                                                >
                                                    {item}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                    {useTwoColumns && (
                                        <View style={styles.columnHalfRight}>
                                            {colTwo.map((item: string, i: number) => (
                                                <View key={i} style={styles.bulletItem}>
                                                    <Text style={styles.bulletDot}>•</Text>
                                                    <Text style={styles.bulletText}>{item}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                            </View>
                        </View>
                    );
                })}



                <View style={styles.serviceRowBordered}>
                    <Text style={styles.serviceNumber}>
                        {String(
                            (serviceBlocks && serviceBlocks.length > 0 ? serviceBlocks.length : 1) + 1
                        ).padStart(2, "0")}
                    </Text>
                    <View style={styles.serviceContent}>
                        <Text style={styles.serviceTitleText}>PROJECT TIMELINE</Text>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>
                                {primaryService?.timeline || "Within 30 Days"}
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>
                                Timeline subject to client approvals and feedback.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

        </>

    );

}