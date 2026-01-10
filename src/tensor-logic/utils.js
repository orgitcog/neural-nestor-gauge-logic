/**
 * Utility functions for tensor operations
 *
 * These functions provide common patterns used across examples,
 * especially for operations that need manual computation when
 * einsum doesn't handle the exact pattern needed.
 */
import { createTensor } from './core';
/**
 * Broadcast-add a 1D tensor to each "row" of a higher-dimensional tensor.
 *
 * Example: Add bias vector to each batch element
 *   result[b, h] = tensor[b, h] + bias[h]
 *
 * @param tensor - The tensor to add to (shape [..., dim])
 * @param bias - The 1D tensor to broadcast (shape [dim])
 * @param dimIndex - Which dimension index to broadcast along (default: last)
 * @returns New tensor with bias added
 */
export function broadcastAdd(tensor, bias, dimIndex = tensor.shape.length - 1) {
    if (bias.shape.length !== 1) {
        throw new Error('bias must be 1D tensor');
    }
    if (bias.shape[0] !== tensor.shape[dimIndex]) {
        throw new Error(`bias dimension ${bias.shape[0]} must match tensor dimension ${tensor.shape[dimIndex]}`);
    }
    const result = createTensor(`${tensor.name}_plus_bias`, tensor.indices, tensor.shape, 'zeros');
    // Compute flat index calculation
    const totalSize = tensor.shape.reduce((a, b) => a * b, 1);
    const dimSize = tensor.shape[dimIndex];
    // Stride for the dimension we're broadcasting along
    let stride = 1;
    for (let i = tensor.shape.length - 1; i > dimIndex; i--) {
        stride *= tensor.shape[i];
    }
    for (let i = 0; i < totalSize; i++) {
        // Calculate which position in the broadcast dimension
        const dimPos = Math.floor((i / stride) % dimSize);
        result.data[i] = tensor.data[i] + bias.data[dimPos];
    }
    return result;
}
/**
 * Element-wise multiply with broadcasting.
 *
 * Example: Multiply each element by a 1D weight vector
 *   result[n, l, d] = tensor[n, l, d] * weights[d]
 *
 * @param tensor - The tensor to multiply
 * @param weights - The 1D tensor to broadcast multiply
 * @param dimIndex - Which dimension index to broadcast along (default: last)
 * @returns New tensor with element-wise multiplication
 */
export function broadcastMultiply(tensor, weights, dimIndex = tensor.shape.length - 1) {
    if (weights.shape.length !== 1) {
        throw new Error('weights must be 1D tensor');
    }
    if (weights.shape[0] !== tensor.shape[dimIndex]) {
        throw new Error(`weights dimension ${weights.shape[0]} must match tensor dimension ${tensor.shape[dimIndex]}`);
    }
    const result = createTensor(`${tensor.name}_weighted`, tensor.indices, tensor.shape, 'zeros');
    // Compute flat index calculation
    const totalSize = tensor.shape.reduce((a, b) => a * b, 1);
    const dimSize = tensor.shape[dimIndex];
    // Stride for the dimension we're broadcasting along
    let stride = 1;
    for (let i = tensor.shape.length - 1; i > dimIndex; i--) {
        stride *= tensor.shape[i];
    }
    for (let i = 0; i < totalSize; i++) {
        // Calculate which position in the broadcast dimension
        const dimPos = Math.floor((i / stride) % dimSize);
        result.data[i] = tensor.data[i] * weights.data[dimPos];
    }
    return result;
}
/**
 * Extract a slice from a tensor along a specific dimension.
 *
 * Example: Extract layer L from embeddings
 *   result[n, d] = tensor[n, l=L, d]
 *
 * @param tensor - The tensor to slice
 * @param dimIndex - Which dimension to slice
 * @param sliceIndex - Which slice to extract
 * @returns New tensor with the specified slice
 */
export function extractSlice(tensor, dimIndex, sliceIndex) {
    if (sliceIndex < 0 || sliceIndex >= tensor.shape[dimIndex]) {
        throw new Error(`sliceIndex ${sliceIndex} out of bounds for dimension ${dimIndex} with size ${tensor.shape[dimIndex]}`);
    }
    // New shape without the sliced dimension
    const newShape = [...tensor.shape];
    newShape.splice(dimIndex, 1);
    // New indices without the sliced dimension
    const newIndices = [...tensor.indices];
    newIndices.splice(dimIndex, 1);
    const result = createTensor(`${tensor.name}_slice`, newIndices, newShape, 'zeros');
    // Calculate strides for the original tensor
    const strides = [];
    let stride = 1;
    for (let i = tensor.shape.length - 1; i >= 0; i--) {
        strides[i] = stride;
        stride *= tensor.shape[i];
    }
    // Calculate strides for the result tensor (without the sliced dimension)
    const resultStrides = [];
    stride = 1;
    for (let i = newShape.length - 1; i >= 0; i--) {
        resultStrides[i] = stride;
        stride *= newShape[i];
    }
    // Iterate over all positions in the result tensor
    const resultSize = newShape.reduce((a, b) => a * b, 1);
    for (let resultIdx = 0; resultIdx < resultSize; resultIdx++) {
        // Convert result index to multi-dimensional coordinates
        // Working backwards: for shape [a, b, c], idx -> [i, j, k] where:
        // k = idx % c
        // j = (idx / c) % b
        // i = (idx / (c * b)) % a
        const coords = new Array(newShape.length);
        let temp = resultIdx;
        for (let i = newShape.length - 1; i >= 0; i--) {
            coords[i] = temp % newShape[i];
            temp = Math.floor(temp / newShape[i]);
        }
        // Map to original tensor coordinates (insert sliceIndex at dimIndex)
        const origCoords = [];
        for (let i = 0; i < tensor.shape.length; i++) {
            if (i < dimIndex) {
                origCoords[i] = coords[i];
            }
            else if (i === dimIndex) {
                origCoords[i] = sliceIndex;
            }
            else {
                origCoords[i] = coords[i - 1];
            }
        }
        // Calculate flat index in original tensor
        let flatIdx = 0;
        for (let i = 0; i < tensor.shape.length; i++) {
            flatIdx += origCoords[i] * strides[i];
        }
        result.data[resultIdx] = tensor.data[flatIdx];
    }
    return result;
}
