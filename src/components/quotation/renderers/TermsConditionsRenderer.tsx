import React from "react";

import ContainerRenderer from "./ContainerRenderer";

import type { PaginationContainer } from "@/documents/pdf/DocumentLayoutEngine";

type Props = {
    container: PaginationContainer;
    styles: any;
};

export default function TermsConditionsRenderer({
    container,
    styles,
}: Props) {

    return (

        <ContainerRenderer
            container={container}
            style={styles.termsCard}
        />

    );

}