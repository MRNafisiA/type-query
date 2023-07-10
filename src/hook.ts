import { Param } from './types/Entity';
import { Query } from 'pg';

type OnSendQueryHook = (query: string, params: Param[]) => void;
type AddHook = (hookAndEvent: { event: 'on-send-query'; hook: OnSendQueryHook }) => void;
type RemoveHook = (hookAndEvent: { event: 'on-send-query'; hook: OnSendQueryHook }) => void;

const addHook: AddHook = ({ event, hook }) => {
    switch (event) {
        case 'on-send-query':
            onSendQueryHooks.push(hook);
            break;
    }
};
const removeHook: RemoveHook = ({ event, hook }) => {
    switch (event) {
        case 'on-send-query':
            onSendQueryHooks.splice(onSendQueryHooks.indexOf(hook), 1);
            break;
    }
};

const onSendQueryHooks: OnSendQueryHook[] = [];
const submit = Query.prototype.submit;
Query.prototype.submit = function (this: any) {
    onSendQueryHooks.forEach(hook => hook(this.text, this.values));
    submit.apply(this, arguments as any);
};

export type { OnSendQueryHook, AddHook, RemoveHook };
export { addHook, removeHook };
