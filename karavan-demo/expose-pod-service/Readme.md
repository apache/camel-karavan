
1. These examples expose NodePort service for the Integration. 
2. Services can be listed by executing command
   ```
   kubectl get svc
   ```
2. The integration code creates a TCP listener. You can connect to it using any TCP client like telnet. 
   ```
   telnet your-node-ip Nodeport
   ```
3. Tcp connection can be disconnected by typing `quit`

