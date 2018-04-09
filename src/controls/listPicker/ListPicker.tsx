import * as React from 'react';
import { IDropdownOption, IDropdownProps, Dropdown } from 'office-ui-fabric-react/lib/components/Dropdown';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/components/Spinner';

import { IListPickerProps, IListPickerState } from './IListPicker';
import { ISPService } from '../../services/ISPService';
import { SPServiceFactory } from '../../services/SPServiceFactory';

import styles from './ListPicker.module.scss';

/**
 * Empty list value, to be checked for single list selection
 */
const EMPTY_LIST_KEY = 'NO_LIST_SELECTED';

/**
 * Renders the controls for the ListPicker component
 */
export class ListPicker extends React.Component<IListPickerProps, IListPickerState> {
    private _options: IDropdownOption[] = [];
    private _selectedList: string | string[];
    
    /**
     * Constructor method
     */
    constructor(props: IListPickerProps) {
        super(props);
        
        console.debug('selectedList', this.props.selectedList);

        this.state = {
            options: this._options,
            loading: false
        };

        this.onChanged = this.onChanged.bind(this);
    }

    /**
     * Lifecycle hook when component is mounted
     */
    public componentDidMount() {
        this.loadLists();
    }

    /**
     * Loads the list from SharePoint current web site
     */
    private loadLists() {
        const { context, baseTemplate, includeHidden, orderBy, multiSelect, selectedList } = this.props;

        // Show the loading indicator and disable the dropdown
        this.setState({ loading: true });

        const service: ISPService = SPServiceFactory.createService(context, true, 5000);
        service.getLibs({ 
            baseTemplate: baseTemplate,
            includeHidden: includeHidden,
            orderBy: orderBy
        }).then((results) => {
            // Start mapping the lists to the dropdown option
            results.value.map(list => {                
                this._options.push({
                    key: list.Id,
                    text: list.Title
                });
            });

            if (multiSelect !== true) {
                // Add option to unselct list
                this._options.unshift({
                    key: EMPTY_LIST_KEY,
                    text: ''
                });
            }

            this._selectedList = this.props.selectedList;

            // Hide the loading indicator and set the dropdown options and enable the dropdown
            this.setState({
                loading: false,
                options: this._options,
                selectedList: this._selectedList
            });
        });
    }

    /**
     * Raises when a list has been selected
     * @param option the new selection
     * @param index the index of the selection
     */
    private onChanged(option: IDropdownOption, index?: number): void {
        const { multiSelect, onSelectionChanged } = this.props;
        
        if (multiSelect === true) {
            if (this._selectedList === undefined) {
                this._selectedList = new Array<string>();
            }
            (this._selectedList as string[]).push(option.key as string);
        } else {
            this._selectedList = option.key as string;
        }

        if (onSelectionChanged) {
            onSelectionChanged(this._selectedList);
        }
    }

    /**
     * Renders the ListPicker controls with Office UI Fabric
     */
    public render(): JSX.Element {
        const { loading, options, selectedList } = this.state;
        const { className, disabled, multiSelect, label, placeHolder } = this.props;

        const dropdownOptions: IDropdownProps = {
            className: className,
            options: options,
            disabled: ( loading || disabled ),
            label: label,
            placeHolder: placeHolder,
            onChanged: this.onChanged
        };

        if (multiSelect === true) {
            dropdownOptions.multiSelect = true;
            dropdownOptions.selectedKeys = selectedList as string[];
        } else {
            dropdownOptions.selectedKey = selectedList as string;
        }

        return (
            <div className={ styles.listPicker }>
                { loading && <Spinner className={ styles.spinner } size={SpinnerSize.xSmall} /> }
                <Dropdown {...dropdownOptions} />
            </div>
        );
    }
}

export default ListPicker;