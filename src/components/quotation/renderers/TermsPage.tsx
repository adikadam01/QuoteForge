//TermsPage.tsx

import React from "react";

import ContainerRenderer from "./ContainerRenderer";

import type { PDFPage } from "@/documents/pdf/DocumentLayoutEngine";

type Props = {

    page: PDFPage;

    styles: any;

};

export default function TermsPage({

    page,

    styles,

}: Props) {

    return (

        <>

            {page.containers
                .filter(container =>
                    container.id === "payment-terms" ||
                    container.id === "terms"
                )
                .map(container => (

                    <ContainerRenderer

                        key={container.id}

                        container={container}

                        style={
                            container.id === "terms"
                                ? styles.termsCard
                                : styles.paymentTermsBlock
                        }

                    />

                ))}

        </>

    );

}

