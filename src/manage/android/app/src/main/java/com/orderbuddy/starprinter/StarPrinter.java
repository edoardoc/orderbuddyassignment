package com.orderbuddy.starprinter;

import com.starmicronics.stario.StarIOPort;
import com.starmicronics.stario.StarIOPortException;
import com.starmicronics.stario.StarPrinterStatus;

public class StarPrinter {

    private final String portName;
    private final String portSettings;

    public StarPrinter(String ipAddress) {
        this.portName = "TCP:" + ipAddress;
        this.portSettings = "";
    }

    public void print(byte[] data) throws StarIOPortException {
        StarIOPort port = null;
        try {
            port = StarIOPort.getPort(portName, portSettings, 10000);
            port.writePort(data, 0, data.length);
            StarPrinterStatus status = port.retreiveStatus();
            System.out.println(status.offline);
        } catch (StarIOPortException e) {
            //throw new RuntimeException(e);
            System.out.println(e.getMessage());
        } finally {
            if (port != null) {
                StarIOPort.releasePort(port);
            }
        }
    }
}
