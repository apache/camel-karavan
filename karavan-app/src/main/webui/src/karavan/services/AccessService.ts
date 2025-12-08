import {AccessApi} from "../api/AccessApi";
import {useAccessStore} from "../stores/AccessStore";

export class AccessService {

    public static refreshAccess() {
        AccessApi.getUsers(users => {
            useAccessStore.setState({users: users});
        })
        AccessApi.getRoles(roles => {
            useAccessStore.setState({roles: roles});
        })
    }
}