package com.orderbuddy.starprinter

import android.util.Log

/**
 * Guard class to prevent duplicate printing of orders
 */
object PrintGuard {
    private val printedOrders = mutableSetOf<String>()
    
    /**
     * Try to mark an order as printed.
     * @param orderId The order ID to check/add
     * @return true if it's the first time, false if already printed
     */
    @Synchronized
    fun tryPrint(orderId: String): Boolean {
        if (printedOrders.contains(orderId)) {
            Log.d("PrintGuard", "Duplicate print attempt detected for order $orderId")
            return false // already printed
        }
        printedOrders.add(orderId)
        return true // proceed with printing
    }
    
    /**
     * Clear an order from the printed list to allow retrying.
     * @param orderId The order ID to remove
     */
    @Synchronized
    fun clear(orderId: String) {
        printedOrders.remove(orderId)
        Log.d("PrintGuard", "Cleared order $orderId from print history")
    }
    
    /**
     * Get the current count of tracked orders (for debugging)
     */

}