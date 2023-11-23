import structlog
import threading
import helpers
import time
import modem
import base64
import ujson as json
from data_handler import DATA
class DATABROADCAST(DATA):
    """Terminal Node Controller for FreeDATA"""

    log = structlog.get_logger("BROADCAST")

    def __init__(self, config, event_queue, states) -> None:
        super().__init__(config, event_queue, states)

        self.log = structlog.get_logger("DHDBC")
        self.states = states
        self.event_queue = event_queue

        self.mycallsign = config['STATION']['mycall']

        self.fec_wakeup_callsign = bytes()
        self.longest_duration = 6
        self.wakeup_received = False
        self.broadcast_timeout_reached = False
        self.broadcast_payload_bursts = 1
        self.broadcast_watchdog = threading.Thread(
            target=self.watchdog, name="watchdog thread", daemon=True
        )
        self.broadcast_watchdog.start()
        self.event_queue = event_queue

    def received_fec_wakeup(self, data_in: bytes):
        self.fec_wakeup_callsign = helpers.bytes_to_callsign(bytes(data_in[1:7]))
        self.wakeup_mode = int.from_bytes(bytes(data_in[7:8]), "big")
        bursts = int.from_bytes(bytes(data_in[8:9]), "big")
        self.wakeup_received = True

        modem.RECEIVE_DATAC4 = True

        self.send_data_to_socket_queue(
            freedata="modem-message",
            fec="wakeup",
            mode=self.wakeup_mode,
            bursts=bursts,
            dxcallsign=str(self.fec_wakeup_callsign, "UTF-8")
        )

        self.log.info(
            "[Modem] FRAME WAKEUP RCVD ["
            + str(self.fec_wakeup_callsign, "UTF-8")
            + "] ", mode=self.wakeup_mode, bursts=bursts,
        )

    def received_fec(self, data_in: bytes):
        print(self.fec_wakeup_callsign)

        self.send_data_to_socket_queue(
            freedata="modem-message",
            fec="broadcast",
            dxcallsign=str(self.fec_wakeup_callsign, "UTF-8"),
            data=base64.b64encode(data_in[1:]).decode("UTF-8")
        )

        self.log.info("[Modem] FEC DATA RCVD")

    def send_data_to_socket_queue(self, **jsondata):
        """
        Send information to the UI via JSON and the sock.SOCKET_QUEUE.

        Args:
          Dictionary containing the data to be sent, in the format:
          key=value, for each item. E.g.:
            self.send_data_to_socket_queue(
                freedata="modem-message",
                arq="received",
                status="success",
                uuid=self.transmission_uuid,
                timestamp=timestamp,
                mycallsign=str(self.mycallsign, "UTF-8"),
                dxcallsign=str(Station.dxcallsign, "UTF-8"),
                dxgrid=str(Station.dxgrid, "UTF-8"),
                data=base64_data,
            )
        """

        # add mycallsign and dxcallsign to network message if they not exist
        # and make sure we are not overwrite them if they exist
        try:
            if "mycallsign" not in jsondata:
                jsondata["mycallsign"] = str(self.mycallsign, "UTF-8")
        except Exception as e:
            self.log.debug("[Modem] error adding callsigns to network message", e=e)

        # run json dumps
        json_data_out = json.dumps(jsondata)

        self.log.debug("[Modem] send_data_to_socket_queue:", jsondata=json_data_out)
        # finally push data to our network queue
        self.event_queue.put(json_data_out)

    def watchdog(self):
        while 1:
            if self.wakeup_received:
                timeout = time.time() + (self.longest_duration * self.broadcast_payload_bursts) + 2
                while time.time() < timeout:
                    threading.Event().wait(0.01)

                self.broadcast_timeout_reached = True

                self.log.info(
                    "[Modem] closing broadcast slot ["
                    + str(self.fec_wakeup_callsign, "UTF-8")
                    + "] ", mode=self.wakeup_mode, bursts=self.broadcast_payload_bursts,
                )
                # TODO We need a dynamic way of modifying this
                modem.RECEIVE_DATAC4 = False
                self.fec_wakeup_callsign = bytes()
                self.wakeup_received = False
            else:
                threading.Event().wait(0.01)
