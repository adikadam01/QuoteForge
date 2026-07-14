import React from "react";

import { View } from "@react-pdf/renderer";

import type {
    PaginationBlock,
} from "@/documents/pdf/DocumentLayoutEngine";

type Props = {

    block: PaginationBlock;

};

/**
 * ============================================================================
 * Block Renderer
 * ============================================================================
 *
 * Responsible ONLY for rendering one block.
 *
 * It knows nothing about pages or pagination.
 *
 * ============================================================================
 */

export default function BlockRenderer({

    block,

}: Props) {

    void block;

    return (

        <View />

    );

}