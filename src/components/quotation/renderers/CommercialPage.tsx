import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";
import SignatureImage from "/public/signature.png";

type Props = {
    styles: any;
    quotation: any;
    totals: any;
    serviceBlocks: any[];
    brandKit: any;
    companyName: string;
    currentClient: any;
    formatCurrency: any;
};

export default function CommercialPage(props: Props) {

    const {
        styles,
        quotation,
        totals,
        serviceBlocks,
        brandKit,
        companyName,
        currentClient,
        formatCurrency,
    } = props;



    return (
        <>
            <View style={styles.page2TitleBlock}>
                <Text style={styles.sectionLabel}>PRICING &amp; TERMS</Text>
                <Text style={styles.pageHeading}>COMMERCIAL DETAILS</Text>
            </View>


            {/* Commercial Summary Table */}
            <View style={styles.tableWrap}>
                <View style={styles.tableHeaderRow}>
                    <View style={styles.tableHeaderCellService}>
                        <Text style={styles.tableHeaderText}>SERVICE</Text>
                    </View>
                    <View style={styles.tableHeaderCellDesc}>
                        <Text style={styles.tableHeaderText}>DESCRIPTION</Text>
                    </View>
                    <View style={styles.tableHeaderCellPrice}>
                        <Text style={styles.tableHeaderText}>ORIGINAL PRICE</Text>
                    </View>
                    <View style={styles.tableHeaderCellPrice}>
                        <Text style={styles.tableHeaderText}>DISCOUNTED PRICE</Text>
                    </View>
                </View>

                {(serviceBlocks && serviceBlocks.length > 0
                    ? serviceBlocks
                    : []
                ).map((s: any, idx: number, arr: any[]) => (
                    <View
                        key={`${s.service_id ?? idx}-${idx}`}
                        style={idx !== arr.length - 1 ? styles.tableRow : styles.tableRowLast}
                    >
                        <View style={styles.tableCellService}>
                            <Text style={styles.tableCellServiceText}>{s.service_name}</Text>
                        </View>
                        <View style={styles.tableCellDesc}>
                            <Text style={styles.tableCellDescText}>{s.description || "—"}</Text>
                        </View>
                        <View style={styles.tableCellPrice}>
                            <Text style={styles.tableCellPriceOriginal}>
                                {formatCurrency(s.price ?? 0, quotation.currency)}
                            </Text>
                        </View>
                        <View style={styles.tableCellPrice}>
                            <Text style={styles.tableCellPriceDiscounted}>
                                {formatCurrency(s.discounted_price ?? s.price ?? 0, quotation.currency)}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsWrap}>
                <View style={styles.totalsBox}>
                    <View style={styles.totalsRow}>
                        <Text style={styles.totalsLabel}>Subtotal</Text>
                        <Text style={styles.totalsValue}>
                            {formatCurrency(totals.subtotal, quotation.currency)}
                        </Text>
                    </View>

                    {totals.discount > 0 && (
                        <View style={styles.totalsRow}>
                            <Text style={styles.totalsLabel}>Discount</Text>
                            <Text style={styles.totalsValue}>
                                -{formatCurrency(
                                    totals.discount,
                                    quotation.currency
                                )}
                            </Text>
                        </View>
                    )}


                    <View style={styles.totalsGrandRow}>
                        <Text style={styles.totalsGrandLabel}>
                            Grand Total
                        </Text>
                        <Text style={styles.totalsGrandValue}>
                            {formatCurrency(
                                totals.total,
                                quotation.currency
                            )}
                        </Text>


                    </View>
                </View>
            </View>


            {/* Contact Information / Signatures */}
            <View style={styles.footerRow}>
                <View style={styles.footerCol}>
                    <Text style={styles.footerColLabel}>CONTACT INFORMATION</Text>
                    <Text style={styles.footerCompanyName}>{companyName}</Text>
                    <Text style={styles.footerContactText}>{brandKit?.phone || "—"}</Text>
                    <Text style={styles.footerContactText}>{brandKit?.email || "—"}</Text>
                    <Text style={styles.footerContactText}>{brandKit?.website || "—"}</Text>
                </View>

                <View style={styles.signatureColumn}>

                    <Text style={styles.signatureHeading}>
                        AUTHORIZED SIGNATURE
                    </Text>

                    <Image
                        source={SignatureImage}
                        style={styles.signatureImage}
                    />

                    <View style={styles.signatureLine} />

                    <Text style={styles.signatureName}>
                        Name & Date
                    </Text>

                </View>

                <View style={styles.footerCol}>
                    <Text style={styles.footerColLabel}>CLIENT SIGNATURE</Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureCaption}>Name &amp; Date</Text>
                </View>
            </View>

            {/* Thank You */}
            <View style={styles.thankYouBlock}>
                <View style={styles.decorativeRow}>
                    <View style={styles.decorativeLine} />
                    <View style={styles.decorativeDot} />
                    <View style={styles.decorativeLine} />
                </View>
                <Text style={styles.thankYouText}>THANK YOU</Text>
                <Text style={styles.thankYouSub}>
                    We appreciate the opportunity to work with{" "}
                    {currentClient?.business_name || currentClient?.name || "you"}.
                </Text>
            </View>

        </>
    );
}