import React from "react";
import { View, Text, Image } from "@react-pdf/renderer";

interface PDFHeaderProps {
    styles: any;

    logoSource?: { uri: string };

    companyName: string;
    companyTagline: string;

    quoteNumber: string;

    quoteDate?: string | null;
    validUntil?: string | null;

    formatDate: (date?: string | null) => string;
}

const PDFHeader: React.FC<PDFHeaderProps> = ({
    styles,
    logoSource,
    companyName,
    companyTagline,
    quoteNumber,
    quoteDate,
    validUntil,
    formatDate,
}) => {
    return (
        <>
            {/* ================= Header ================= */}

            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    {logoSource ? (
                        <Image
                            source={logoSource}
                            style={styles.logoImage}
                        />
                    ) : (
                        <View style={styles.logoPlaceholder} />
                    )}

                    <View style={styles.companyBlock}>
                        <Text style={styles.companyName}>
                            {companyName.toUpperCase()}
                        </Text>

                        <Text style={styles.companyTagline}>
                            {companyTagline.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <Text style={styles.quoteNumberText}>
                        QT-{quoteNumber.slice(-6)}
                    </Text>

                    <Text style={styles.metaLine}>
                        Date:{" "}
                        <Text style={styles.metaLineValue}>
                            {formatDate(quoteDate)}
                        </Text>
                    </Text>

                    <Text style={styles.metaLine}>
                        Valid Until:{" "}
                        <Text style={styles.metaLineValue}>
                            {formatDate(validUntil)}
                        </Text>
                    </Text>
                </View>
            </View>

            {/* Divider */}

            <View style={styles.divider} />
        </>
    );
};

export default PDFHeader;