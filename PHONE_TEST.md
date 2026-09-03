# Test Bell Before Dusk on a phone

No Apple developer account, App Store build, or cable is required.

1. Connect the phone and PC to the same private Wi-Fi network.
2. Right-click `Start-Phone-Test.ps1` and choose **Run with PowerShell**.
3. Accept the Windows administrator prompt. The rule permits only TCP port 4173, only on Private networks, and only from the local subnet.
4. Leave the PowerShell window open while testing.
5. Open the address printed by the script in iPhone Safari. The same address is saved to `PHONE_TEST_URL.txt`.
6. Keep the phone in portrait orientation and tap once to enable game audio.
7. When testing is finished, run `Stop-Phone-Test.ps1` and accept the administrator prompt. It stops the server and removes the temporary firewall rule.

If the page still does not open, confirm that the phone is not using a guest Wi-Fi network with device isolation and temporarily disable any VPN on the phone.
